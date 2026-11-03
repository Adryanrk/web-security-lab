# 03 — Stored Cross-Site Scripting / XSS (OWASP A03)

**Severity:** High
**Location:** `views/item.ejs` — comment rendering (data from `comments.content`)

## Summary
Comments are rendered into the page as raw, unescaped HTML. An attacker can
store a comment containing a `<script>` (or an event handler such as
`onerror`), which is then executed in the browser of every user who views that
item. Because the payload is stored in the database, it runs again on every
visit — this is *stored* (persistent) XSS.

## Vulnerable code
```ejs
<!-- raw/unescaped output: stored HTML is rendered and executed -->
<p><%- c.content %></p>
```
Root cause is the same as SQL injection, in the other direction: user-supplied
data is treated as code. Here the data is pasted straight into the HTML the
browser parses.

## How it is exploited (step by step)
1. Log in as **alice** and open your own item (`/items/1`).
2. In the comment field, submit a payload, e.g.:
   ```html
   <script>alert('XSS')</script>
   ```
   or, equivalently:
   ```html
   <img src=x onerror="alert('XSS')">
   ```
3. You are redirected back to the item and the script runs immediately in your
   own browser.
4. **The real impact:** log out, log in as **admin**, and open `/items/1`
   (admin can view any item). The script runs again — now in *admin's* browser.
   The payload was stored once and executes for every viewer.

*(Insert screenshot: the alert firing while viewing the item as admin.)*

## Impact
- Code execution in the victim's browser, in the victim's session.
- An attacker can perform actions as the victim (send requests with their
  session), rewrite page content, or redirect them.
- With an admin victim this becomes a path to account takeover / privilege
  escalation.

Note: the session cookie is set `httpOnly`, so `document.cookie` cannot read it
— a useful defense-in-depth property that limits cookie theft. XSS can still act
within the victim's session, so this does not make the flaw safe.

The blast radius here is limited by the earlier IDOR fix: only the item owner
and admin can view an item, so only they can be hit by a comment on it.

## Remediation
Render user content with the **escaped** output tag so HTML is shown as text,
not executed:
```ejs
<!-- escaped output: shown as text, never run -->
<p><%= c.content %></p>
```
Principle: escape on output, everywhere user-controlled data enters HTML. For
richer needs, sanitize allowed HTML with a vetted library (e.g. DOMPurify) and
add a Content-Security-Policy header as defense in depth. Escaping at the point
of output is the primary fix.

## Reference
OWASP A03:2021 — Injection (Cross-Site Scripting) · https://owasp.org/Top10/A03_2021-Injection/
