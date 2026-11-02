// routes/profile.js
// Visa och uppdatera egen profil (bio). Bio escapas vid rendering,
// så den säkra versionen är fri från stored XSS.
const express = require('express');
const db = require('../db/db');
const requireLogin = require('../middleware/requireLogin');

const router = express.Router();

router.get('/profile', requireLogin, (req, res) => {
  const user = db
    .prepare('SELECT id, username, role, bio, created_at FROM users WHERE id = ?')
    .get(req.session.userId);
  res.render('profile', { user, saved: req.query.saved === '1' });
});

router.post('/profile', requireLogin, (req, res) => {
  const bio = (req.body.bio || '').slice(0, 500);
  db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio, req.session.userId);
  res.redirect('/profile?saved=1');
});

module.exports = router;
