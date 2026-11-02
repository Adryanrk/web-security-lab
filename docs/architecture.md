# Arkitektur

En enkel serverrenderad webbapp. Allt kör lokalt i en process.

```
   Webbläsare
       │  HTTP (localhost:3000)
       ▼
   Express (server.js)
       │   ├─ express-session  → sessionscookie (httpOnly)
       │   ├─ routes/auth.js    → register / login / logout
       │   ├─ routes/items.js   → dashboard / items / kommentarer
       │   └─ routes/profile.js → visa / uppdatera bio
       ▼
   node:sqlite  →  db/lab.db
```

## Datamodell
- **users** — id, username, password (bcrypt-hash), role, bio, created_at
- **items** — id, owner_id → users.id, title, body, created_at
- **comments** — id, item_id → items.id, author_id → users.id, content, created_at

## Attackytor (för testningen)
- Inloggningsformuläret (username/password) → injection, auth-brister
- `/items/:id` — id i URL:en → access-kontroll / IDOR
- Profil-bio och kommentarsfält → lagrad input som renderas → XSS
- Felhantering → informationsläckage
