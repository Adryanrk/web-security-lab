# Architecture

A simple server-rendered web app. Everything runs locally in one process.

```
   Browser
       │  HTTP (localhost:3000)
       ▼
   Express (server.js)
       │   ├─ express-session  → session cookie (httpOnly)
       │   ├─ routes/auth.js    → register / login / logout
       │   ├─ routes/items.js   → dashboard / items / comments
       │   └─ routes/profile.js → show / update bio
       ▼
   node:sqlite  →  db/lab.db
```

## Data model
- **users** — id, username, password, role, bio, created_at
- **items** — id, owner_id → users.id, title, body, created_at
- **comments** — id, item_id → items.id, author_id → users.id, content, created_at

## Attack surface (for testing)
- The login form (username/password) → injection, auth flaws
- `/items/:id` — id in the URL → access control / IDOR
- Profile bio and comment fields → stored input that gets rendered → XSS
- Error handling → information leakage
