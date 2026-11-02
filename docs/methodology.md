# Methodology

Testing follows a simplified but realistic penetration-test flow. Each
vulnerability is documented with the same structure in `findings/` so the
report stays consistent.

## Phases
1. **Recon / mapping** — go through every page, form, URL parameter and API
   call. Note where user input is accepted (that is the attack surface).
2. **Identification** — form hypotheses: "this field may go straight into a
   SQL query", "this id in the URL may not be authorization-checked".
3. **Exploitation** — confirm the hypothesis with a concrete attack.
4. **Verification** — show the impact: what can an attacker actually access
   or do?
5. **Remediation** — fix the flaw in the code and show the attack no longer
   works.
6. **Documentation** — write it all up while it is fresh.

## Tooling
- **Burp Suite Community** or **OWASP ZAP** — intercepting proxy between the
  browser and the app. Used to read and manipulate requests.
- **Browser DevTools** — network tab, cookies, console.
- **curl** — to quickly reproduce a request from the terminal.

## Severity
Each finding is rated to mirror a real report:

| Rating   | Meaning (roughly)                                    |
|----------|------------------------------------------------------|
| Critical | Full compromise / access to all data                 |
| High     | Access to another user's data or account             |
| Medium   | Limited exposure, requires some precondition         |
| Low      | Information leakage with little direct impact         |

## Write-up template
See `findings/_TEMPLATE.md`.
