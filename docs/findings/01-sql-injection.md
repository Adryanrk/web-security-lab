# 01 — SQL Injection in the login (OWASP A03)

**Severity:** Critical
**Location:** `routes/auth.js` — `POST /login`

## Summary
The login form builds its SQL query by concatenating user input directly into
the command string. An attacker can therefore inject SQL syntax and bypass
authentication entirely — logging in as any user, including admin, without
knowing any password.

## Vulnerable code
```js
const sql =
  "SELECT * FROM users WHERE username = '" + username +
  "' AND password = '" + password + "'";
const user = db.prepare(sql).get();
if (user) { /* logged in */ }
```
The problem: the database cannot tell code (written by the developer) from
data (written by the user). Anything typed into the fields becomes part of the
SQL statement.

## How it is exploited (step by step)
1. Go to `/login`.
2. Enter:
   - **Username:** `' OR 1=1 -- `
   - **Password:** anything
3. The resulting query becomes:
   ```sql
   SELECT * FROM users WHERE username = '' OR 1=1 --' AND password = '...'
   ```
   - `' ` closes the username string early
   - `OR 1=1` is always true → the condition matches every row
   - `--` comments out the rest of the query (the password check)
4. The first row in the table (admin) is returned → logged in as **admin**
   without a password.

Target a specific user:
- Username `admin' -- ` → logged in as admin
- Username `alice' -- ` → logged in as alice

Confirm injection is possible (error-based indicator):
- Username `'` (a single quote) → the app returns a SQL syntax error, which
  reveals that input is being interpreted as code.

*(Insert screenshot: logged in as admin after the payload.)*

## Impact
- Complete authentication bypass — access to any account.
- Access to the administrator account → all functionality and data in the portal.
- The same class of flaw can often be extended to dump the whole database
  (usernames, passwords) via UNION- or error-based injection.

Rated **Critical**.

## Note on this environment
The driver (`node:sqlite`) only runs a single statement per `prepare`, so
"stacked queries" (`'; DROP TABLE users; --`) do not execute here. Injection
*within* the single SELECT statement (bypass, UNION) works fully, which is the
most common case in practice.

## Remediation
Use a **parameterised query** (prepared statement with a placeholder):
```js
const user = db
  .prepare('SELECT * FROM users WHERE username = ?')
  .get(username);
if (!user || user.password !== password) {
  return res.render('login', { error: 'Wrong username or password.' });
}
```
Why it works: with `?`, input is always sent as a **value**, never as code.
The database compiles the query structure first and then binds the data — there
is simply no way to "break out" of the value. The password is also checked
separately rather than inside the SQL statement.

> Follow-up: passwords are still stored and compared in plaintext here. That is
> tracked separately as A02 (Cryptographic Failures), where bcrypt hashing is
> reintroduced.

Additional defenses: validate input, run the database account with least
privilege, and never leak raw SQL error messages to the user.

## Reference
OWASP A03:2021 — Injection · https://owasp.org/Top10/A03_2021-Injection/
