// routes/items.js
// ---------------------------------------------------------------------------
// Dashboard + enskild item-vy med kommentarer.
// SÄKER baslinje:
//   - Access-kontroll: /items/:id kontrollerar ÄGANDE innan data visas.
//     (I sårbara versionen tar vi bort den kontrollen -> IDOR.)
//   - Kommentarer lagras som text och escapas av EJS vid rendering (<%= %>)
//     -> ingen stored XSS. (Sårbara versionen renderar oescapat.)
// ---------------------------------------------------------------------------
const express = require('express');
const db = require('../db/db');
const requireLogin = require('../middleware/requireLogin');

const router = express.Router();

// Dashboard: visar bara den inloggade användarens egna items.
router.get('/dashboard', requireLogin, (req, res) => {
  const items = db
    .prepare('SELECT * FROM items WHERE owner_id = ? ORDER BY created_at DESC')
    .all(req.session.userId);
  res.render('dashboard', { items });
});

// Enskild item + kommentarer.
router.get('/items/:id', requireLogin, (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);

  if (!item) return res.status(404).render('404');
  
  const isOwner = item.owner_id === req.session.userId;
  const isAdmin = req.session.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).render('403');
  }

  // Ägarkontroll — åtgärd mot IDOR. Bakgrund: docs/findings/02-idor.md

  //
  
  // 🟢 ÅTGÄRD: återinför ägarkontrollen (det är hela fixen):
  //
  //   const isOwner = item.owner_id === req.session.userId;
  //   const isAdmin = req.session.role === 'admin';
  //   if (!isOwner && !isAdmin) {
  //     return res.status(403).render('403');
  //   }
  //
  // =========================================================================

  const comments = db
    .prepare(
      `SELECT c.content, c.created_at, u.username
         FROM comments c JOIN users u ON u.id = c.author_id
        WHERE c.item_id = ? ORDER BY c.created_at ASC`
    )
    .all(item.id);

  res.render('item', { item, comments });
});

// Lägg till en kommentar.
router.post('/items/:id/comments', requireLogin, (req, res) => {
  const item = db.prepare('SELECT id FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).render('404');

  const content = (req.body.content || '').trim();
  if (content) {
    db.prepare(
      'INSERT INTO comments (item_id, author_id, content) VALUES (?, ?, ?)'
    ).run(item.id, req.session.userId, content);
  }
  res.redirect('/items/' + item.id);
});

module.exports = router;
