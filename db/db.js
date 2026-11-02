// db/db.js
// ---------------------------------------------------------------------------
// Öppnar SQLite-databasen och skapar/seedar den vid första körning.
// Vi använder Nodes INBYGGDA SQLite (node:sqlite) -> inget byggsteg, inga
// extra paket. API:t (prepare/get/all/run) är i praktiken identiskt med
// better-sqlite3, så koden ser likadan ut.
// ---------------------------------------------------------------------------
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'lab.db');
const db = new DatabaseSync(DB_PATH);

// WAL ger bättre samtidighet; inte säkerhetsrelaterat, bara god praxis.
db.exec('PRAGMA journal_mode = WAL');

// --- Schema ---------------------------------------------------------------
// LABB: i den sårbara versionen lagras lösenord i KLARTEXT (osäkert med flit).
// Det hör ihop med den kommande A02-lektionen (Cryptographic Failures) och
// gör också SQLi-demon i inloggningen tydlig. Den säkra baslinjen använde
// bcrypt-hash — den koden återkommer i åtgärdsförslaget för A02.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,            -- LABB: klartext (osäkert med flit)
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

// --- Seed (körs bara om tabellen är tom) ----------------------------------
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

  // Testkonton. Lösenorden är kända med flit — detta är ett labb.
  // Lagras i KLARTEXT (se kommentaren vid schemat ovan).
  const adminId = insertUser.run('admin', 'Admin!2026', 'admin',
    'Administratörskonto för portalen.').lastInsertRowid;
  const aliceId = insertUser.run('alice', 'alice123', 'user',
    'Hej, jag heter Alice.').lastInsertRowid;
  const bobId = insertUser.run('bob', 'bob123', 'user',
    'Bob här. Gillar kaffe.').lastInsertRowid;

  // Lite innehåll per användare, så IDOR m.m. har något att visa senare.
  const a1 = insertItem.run(aliceId, 'Alices privata anteckning',
    'Hemlig text som bara Alice ska kunna se.').lastInsertRowid;
  insertItem.run(bobId, 'Bobs inköpslista', 'Mjölk, bönor, kaffe.');
  insertItem.run(adminId, 'Driftnotis', 'Internt: serverunderhåll söndag.');

  insertComment.run(a1, bobId, 'Snygg anteckning!');
}

module.exports = db;
