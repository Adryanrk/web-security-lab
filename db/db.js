// db/db.js
// ---------------------------------------------------------------------------
// Opens the SQLite database and creates/seeds it on first run.
// We use Node's BUILT-IN SQLite (node:sqlite) -> no build step, no extra
// packages. The API (prepare/get/all/run) is effectively identical to
// better-sqlite3, so the code reads the same.
// ---------------------------------------------------------------------------
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'lab.db');
const db = new DatabaseSync(DB_PATH);

// WAL improves concurrency; not security-related, just good practice.
db.exec('PRAGMA journal_mode = WAL');

// --- Schema ---------------------------------------------------------------
// Passwords are stored as a bcrypt HASH, never in plaintext (A02 fix).
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,            -- bcrypt hash
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

  // Test accounts. Passwords are known on purpose (this is a lab) but stored
  // as bcrypt hashes — the plaintext never touches the database.
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const adminId = insertUser.run('admin', hash('Admin!2026'), 'admin',
    'Administrator account for the portal.').lastInsertRowid;
  const aliceId = insertUser.run('alice', hash('alice123'), 'user',
    "Hi, I'm Alice.").lastInsertRowid;
  const bobId = insertUser.run('bob', hash('bob123'), 'user',
    'Bob here. I like coffee.').lastInsertRowid;

  // Some content per user so IDOR etc. has something to show.
  const a1 = insertItem.run(aliceId, "Alice's private note",
    'Secret text only Alice should be able to see.').lastInsertRowid;
  insertItem.run(bobId, "Bob's shopping list", 'Milk, beans, coffee.');
  insertItem.run(adminId, 'Ops notice', 'Internal: server maintenance on Sunday.');

  insertComment.run(a1, bobId, 'Nice note!');
}

module.exports = db;
