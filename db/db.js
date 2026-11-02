// db/db.js
// ---------------------------------------------------------------------------
// Opens the SQLite database and creates/seeds it on first run.
// We use Node's BUILT-IN SQLite (node:sqlite) -> no build step, no extra
// packages. The API (prepare/get/all/run) is effectively identical to
// better-sqlite3, so the code reads the same.
// ---------------------------------------------------------------------------
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'lab.db');
const db = new DatabaseSync(DB_PATH);

// WAL improves concurrency; not security-related, just good practice.
db.exec('PRAGMA journal_mode = WAL');

// --- Schema ---------------------------------------------------------------
// LAB: in the vulnerable version passwords are stored in PLAINTEXT (insecure
// on purpose). This ties into the upcoming A02 lesson (Cryptographic
// Failures) and also makes the SQLi login demo clear. The secure baseline
// used a bcrypt hash — that code returns in the A02 remediation.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,            -- LAB: plaintext (insecure on purpose)
    role       TEXT NOT NULL DEFAULT 'user',
    bio        TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id   INTEGER NOT NULL,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id    INTEGER NOT NULL,
    author_id  INTEGER NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (item_id)   REFERENCES items(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
  );
`);

// --- Seed (only runs if the table is empty) -------------------------------
const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;

if (userCount === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (username, password, role, bio) VALUES (?, ?, ?, ?)'
  );
  const insertItem = db.prepare(
    'INSERT INTO items (owner_id, title, body) VALUES (?, ?, ?)'
  );
  const insertComment = db.prepare(
    'INSERT INTO comments (item_id, author_id, content) VALUES (?, ?, ?)'
  );

  // Test accounts. Passwords are known on purpose — this is a lab.
  // Stored in PLAINTEXT (see the schema comment above).
  const adminId = insertUser.run('admin', 'Admin!2026', 'admin',
    'Administrator account for the portal.').lastInsertRowid;
  const aliceId = insertUser.run('alice', 'alice123', 'user',
    "Hi, I'm Alice.").lastInsertRowid;
  const bobId = insertUser.run('bob', 'bob123', 'user',
    'Bob here. I like coffee.').lastInsertRowid;

  // Some content per user so IDOR etc. has something to show later.
  const a1 = insertItem.run(aliceId, "Alice's private note",
    'Secret text only Alice should be able to see.').lastInsertRowid;
  insertItem.run(bobId, "Bob's shopping list", 'Milk, beans, coffee.');
  insertItem.run(adminId, 'Ops notice', 'Internal: server maintenance on Sunday.');

  insertComment.run(a1, bobId, 'Nice note!');
}

module.exports = db;
