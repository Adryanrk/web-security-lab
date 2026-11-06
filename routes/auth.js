// routes/auth.js
// ---------------------------------------------------------------------------
// Registration, login, logout.
//
// A03 (SQL Injection): fixed — the login uses a parameterised query.
// A02 (Cryptographic Failures): fixed — passwords are hashed with bcrypt.
// A07 (Authentication Failures): fixed — the login is rate limited, so an
// attacker can no longer make unlimited password guesses (brute force).
// ---------------------------------------------------------------------------
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db/db');

const router = express.Router();

// Rate limiter for the login: at most 5 attempts per IP per 15 minutes.
// Further attempts get HTTP 429 (Too Many Requests) until the window resets.
// This is the baseline defence against brute force and password spraying.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,                 // max 5 requests per window per IP
  message: 'Too many login attempts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

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

  // Hash the password with bcrypt before storing it. The number (10) is the
  // cost/work factor — higher is slower and harder to brute-force.
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (username, password) VALUES (?, ?)')
    .run(username, hash);

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

// loginLimiter runs before the handler — once the limit is hit, requests are
// rejected with 429 before any password check happens.
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  // SECURE (A03 fix): parameterised query — input is bound as DATA, never code.
  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username);

  // SECURE (A02 fix): compare against the stored bcrypt hash. The same generic
  // message for "no such user" and "wrong password" avoids leaking which one.
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
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
