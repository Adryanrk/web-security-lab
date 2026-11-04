# SecureFolio — Web Security Lab

> ⚠️ **Security warning**
> This application contains **intentional** security vulnerabilities and is built
> **only** for local, isolated learning and testing on my own machine. It must
> **never** be deployed, exposed to the internet, or run against systems or data
> I do not own. All testing in this repo is performed against this app, locally.

A hands-on web security lab where I build a realistic web application, deliberately
introduce classic vulnerabilities (OWASP Top 10), exploit them, and then remediate
them — each one documented with a short write-up, in the style of a real penetration
test report.

## Skills demonstrated
- Identifying and exploiting common web vulnerabilities (OWASP Top 10)
- Writing secure code and understanding **why** a fix works, not just that it does
- Both the attacker's and the defender's perspective on each issue
- Clear security documentation and remediation write-ups
- Working responsibly in an isolated, legal test environment

## Approach
Each vulnerability is studied through the same loop:
**secure baseline → introduce the flaw deliberately → exploit it → fix it → verify → document.**
The app is first built securely (parameterised queries, access control, output
encoding); each flaw is then introduced one at a time, so the secure and vulnerable
versions can be compared line by line. The point is to understand the root cause, not
just reproduce a payload.

## Tech stack
- **Node.js + Express** — backend and routing
- **SQLite** (Node's built-in `node:sqlite`) — single-file database, no build step
- **EJS** — server-rendered views
- **express-session** — session handling

## Run locally
```bash
npm install
npm start
# open http://localhost:3000
```
Test accounts are seeded automatically:

| User  | Password     | Role  |
|-------|--------------|-------|
| alice | alice123     | user  |
| bob   | bob123       | user  |
| admin | Admin!2026   | admin |

Reset the database at any time with `npm run reset-db`.

## Vulnerabilities covered (OWASP Top 10)
Checked off as each write-up is completed in `docs/findings/`.

- [x] A01 — Broken Access Control (IDOR on `/items/:id`) → [write-up](docs/findings/02-idor.md)
- [x] A02 — Cryptographic Failures (plaintext passwords → bcrypt) → [write-up](docs/findings/04-plaintext-passwords.md)
- [x] A03 — Injection (SQL injection in the login) → [write-up](docs/findings/01-sql-injection.md)
- [x] A03 — Stored XSS (comments) → [write-up](docs/findings/03-xss.md)
- [ ] A05 — Security Misconfiguration (leaking error messages)
- [ ] A07 — Identification & Authentication Failures (no rate limiting)

## Project structure
```
security-lab-vulnerable-app/
├── app  (server.js, routes/, views/, db/, middleware/)
├── docs/
│   ├── architecture.md      architecture & data flow
│   ├── methodology.md       how the testing is carried out
│   └── findings/            one write-up per vulnerability
└── report/                  final penetration test report (PDF)
```

## Methodology
Recon → identify attack surface → exploit → verify → remediate → document.
Tooling: Burp Suite Community / OWASP ZAP as an intercepting proxy, plus the browser.

## Disclaimer
Built for educational purposes as part of my cybersecurity portfolio. Never use any
of the techniques shown here against systems you do not have explicit permission to test.
