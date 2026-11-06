# 06 — No rate limiting on login / brute force (OWASP A07)

**Severity:** High
**Location:** `routes/auth.js` — `POST /login`

## Summary
The login endpoint accepted unlimited attempts. An attacker could send
thousands of password guesses per second until one worked (brute force), with
no blocking, slowdown, or lockout. Weak passwords fall almost instantly.

## Proof of concept
`tools/brute-force.js` tries a list of passwords against a known account:
```
[1] alice:123456 -> fail
...
[10] alice:alice123 -> SUCCESS

Cracked in 10 attempts:  alice / alice123
```
Ten guesses went through with zero resistance. A real wordlist (e.g.
rockyou.txt) holds millions of common passwords, freely available.

## Impact
- Account takeover of any account with a guessable password.
- Related techniques scale the problem:
  - **Password spraying** — one common password against many accounts, to dodge
    per-account limits.
  - **Credential stuffing** — reusing `username:password` pairs leaked from
    other breaches.
- The login's other protections (parameterised query, bcrypt) do not help here:
  if guessing is unlimited, weak passwords fall regardless.

Rated **High**.

## Remediation
Rate limit the login so an IP gets only a few attempts per time window:
```js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,                 // 5 attempts per IP per window
  message: 'Too many login attempts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, (req, res) => { /* ... */ });
```
After the fix, the proof-of-concept is stopped:
```
[5] alice:welcome -> fail
[6] alice:admin -> BLOCKED (429 Too Many Requests)
```

Rate limiting is the baseline. Defence in depth adds: account lockout or
exponential backoff after repeated failures, CAPTCHA on suspicious activity,
multi-factor authentication (a cracked password alone is then not enough), and
enforcing strong passwords / screening against known-breached ones. Apply
limits per account as well as per IP, since a distributed attacker rotates IPs.

## Reference
OWASP A07:2021 — Identification and Authentication Failures · https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/
