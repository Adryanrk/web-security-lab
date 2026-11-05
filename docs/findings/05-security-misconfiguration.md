# 05 — Verbose error pages leak internals (OWASP A05)

**Severity:** Medium
**Location:** `server.js` — global error handler

## Summary
The application's error handler returned the full stack trace to the client on
any unhandled error. This leaks absolute file paths, the OS account, the
framework and its internal files, and the code structure — information an
attacker uses to fingerprint and target the app. No authentication is required
to trigger it.

## Vulnerable code
```js
app.use((err, req, res, next) => {
  res.status(500).send('<pre>' + err.stack + '</pre>');
});
```

## How it is exploited (step by step)
1. Cause any unhandled error in the app (an attacker probes inputs until
   something throws). In the lab this was triggered via a demo route that
   dereferences `null`.
2. The response returns the raw stack trace, e.g.:
   ```
   TypeError: Cannot read properties of null (reading 'name')
       at C:\Projects\Cybersecurity Projects\security-lab-vulnerable-app\server.js:51:28
       at Layer.handle ... \node_modules\express\lib\router\layer.js:95:5
       ...
   ```

*(Insert screenshot: the stack trace rendered in the browser.)*

## Impact
What leaks, and why it matters:
- **Absolute file paths** — reveal the OS, the directory layout, and often the
  OS username.
- **Framework & libraries** — the trace names `express` and its internal files,
  fingerprinting the stack and hinting at versions.
- **Code structure** — file names and line numbers map how the app is built
  without the attacker ever seeing the source.

Each error returns another piece of the map, so an attacker deliberately probes
for errors. Rated **Medium** (information disclosure that enables more targeted
attacks).

## Remediation
Log the details server-side only; show the user a generic page:
```js
app.use((err, req, res, next) => {
  console.error(err);              // details stay in the server logs
  res.status(500).render('500');   // user sees a generic error page
});
```
General hardening for Security Misconfiguration: run with `NODE_ENV=production`,
remove debug/test endpoints before shipping, disable framework fingerprinting
(`app.disable('x-powered-by')`), and keep verbose diagnostics out of responses.

## Reference
OWASP A05:2021 — Security Misconfiguration · https://owasp.org/Top10/A05_2021-Security_Misconfiguration/
