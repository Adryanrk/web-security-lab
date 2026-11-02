// routes/auth.js
// ---------------------------------------------------------------------------
// Registrering, inloggning, utloggning.
// SÄKER baslinje:
//   - Parametriserade queries (?) -> ingen SQL-injection.
//   - bcrypt.compare -> inga lösenord i klartext, konstant-tids jämförelse.
//   - session.regenerate vid login -> motverkar session fixation.
//   - Generiskt felmeddelande -> avslöjar inte om användarnamnet finns.
// ---------------------------------------------------------------------------
const express = require('express');
const db = require('../db/db');

const router = express.Router();

// --- Registrering ---------------------------------------------------------
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 6) {
    return res.render('register', {
      error: 'Ange användarnamn och ett lösenord på minst 6 tecken.',
    });
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(username);
  if (existing) {
    return res.render('register', { error: 'Användarnamnet är upptaget.' });
  }

  // LABB: lösenordet lagras i klartext (osäkert med flit — se A02 senare).
  // INSERT är fortfarande parametriserad; injektionspunkten i den här
  // lektionen är inloggningen nedan, inte registreringen.
  const info = db
    .prepare('INSERT INTO users (username, password) VALUES (?, ?)')
    .run(username, password);

  req.session.regenerate((err) => {
    if (err) return res.render('register', { error: 'Något gick fel.' });
    req.session.userId = Number(info.lastInsertRowid);
    req.session.username = username;
    req.session.role = 'user';
    res.redirect('/dashboard');
  });
});


// --- Inloggning -----------------------------------------------------------
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 🟢 SÄKER: parametriserad query — input binds som DATA, aldrig som kod.
  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username);

  // Lösenordet jämförs separat som text. (Labbet lagrar klartext just nu;
  // riktig bcrypt-hashning återinför vi i A02-lektionen.)
  if (!user || user.password !== password) {
    return res.render('login', { error: 'Fel användarnamn eller lösenord.' });
  }

  req.session.regenerate((err) => {
    if (err) return res.render('login', { error: 'Något gick fel.' });
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    res.redirect('/dashboard');
  });
});

// --- Utloggning -----------------------------------------------------------
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;
