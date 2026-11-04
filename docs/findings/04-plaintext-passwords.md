# 04 — Passwords stored in plaintext (OWASP A02)

**Severity:** High
**Location:** `db/db.js` (seed) and `routes/auth.js` (register/login)

## Summary
User passwords were stored in the database as plaintext. Anyone who obtains a
copy of the database — through SQL injection, a stolen backup, a misconfigured
cloud bucket, or an insider — gets every user's password immediately, ready to
use. Password reuse then compromises those users' other accounts as well.

## Vulnerable code
```js
// seed / registration stored the raw password
insertUser.run('alice', 'alice123', 'user', ...);
// login compared plaintext
if (!user || user.password !== password) { /* reject */ }
```
A quick dump shows the problem:
```
id  username  password      role
1   admin     Admin!2026    admin
2   alice     alice123      user
3   bob       bob123        user
```

## Impact
- Full credential disclosure on any database leak — no cracking required.
- Password reuse means one leak cascades into victims' email, banking, etc.
- Admin credentials exposed → full application compromise.

Rated **High** (storage weakness that turns any data exposure into total
account compromise).

## Remediation
Store a **bcrypt hash**, never the password. Hashing is one-way: you cannot
derive the password from the hash, so a leak reveals nothing usable.

```js
// store a hash at registration
const hash = bcrypt.hashSync(password, 10);   // 10 = cost / work factor
db.prepare('INSERT INTO users (username, password) VALUES (?, ?)')
  .run(username, hash);

// verify at login — never store or compare plaintext
if (!user || !bcrypt.compareSync(password || '', user.password)) {
  return res.render('login', { error: 'Wrong username or password.' });
}
```

Why bcrypt:
- **One-way hash** — there is nothing to reverse. (Hashing, not encryption:
  encryption is reversible with a key that can itself be stolen.)
- **Per-password salt** — bcrypt generates a random salt and stores it inside
  the hash, so identical passwords produce different hashes. This defeats
  precomputed "rainbow tables" and hides password reuse.
- **Deliberately slow (tunable cost)** — brute-forcing stolen hashes is
  expensive. Fast hashes (MD5, SHA-256) are unsuitable for passwords precisely
  because they are fast.

After the fix, the same dump shows only hashes, e.g.:
```
alice   $2a$10$Nn9...<60 chars>
```
which is useless to an attacker even if the database leaks.

(argon2 and scrypt are modern alternatives to bcrypt with similar properties.)

## Reference
OWASP A02:2021 — Cryptographic Failures · https://owasp.org/Top10/A02_2021-Cryptographic_Failures/
