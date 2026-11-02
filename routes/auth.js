// routes/auth.js
// ---------------------------------------------------------------------------
// Registration, login, logout.
//
// A03 (SQL Injection) has been remediated: the login uses a parameterised
// query, so user input is always treated as DATA, never as code.
//
// Note: passwords are currently stored and compared in PLAINTEXT. That is an
// open, intentional weakness tracked as A02 (Cryptographic Failures); bcrypt
// hashing is reintroduced in that lesson.
// ---------------------------------------------------------------------------
const express = require('express');
const db = require('../db/db');

const router = express.Router();

// --- Registration ---------------------------------------------------------
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 6) {
    return res.render('register', {
      error: 'Enter a username and a password of at least 6 characters.',
    });
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(username);
  if (existing) {
    return res.render('register', { error: 'That username is taken.' });
  }

  // LAB: the password is stored in plaintext (insecure on purpose — see A02).
  // The INSERT is still parameterised; the injection point in that lesson was
  // the login below, not registration.
  const info = db
    .prepare('INSERT INTO users (username, password) VALUES (?, ?)')
    .run(username, password);

  req.session.regenerate((err) => {
    if (err) return res.render('register', { error: 'Something went wrong.' });
    req.session.userId = Number(info.lastInsertRowid);
    req.session.username = username;
    req.session.role = 'user';
    res.redirect('/dashboard');
  });
});

// --- Login ----------------------------------------------------------------
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // SECURE (fix for OWASP A03): parameterised query.
  // '?' is a placeholder — the user's input is bound as DATA and can never
  // become part of the SQL code. That is the whole fix against SQL injection.
  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username);

  // The password is compared separately as text. (The lab stores plaintext
  // for now; real bcrypt hashing is reintroduced in the A02 lesson.)
  if (!user || user.password !== password) {
    return res.render('login', { error: 'Wrong username or password.' });
  }

  req.session.regenerate((err) => {
    if (err) return res.render('login', { error: 'Something went wrong.' });
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    res.redirect('/dashboard');
  });
});

// --- Logout ---------------------------------------------------------------
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;
