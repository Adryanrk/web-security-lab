// routes/items.js
// ---------------------------------------------------------------------------
// Dashboard + single-item view with comments.
//
// A01 (Broken Access Control / IDOR) has been remediated: GET /items/:id now
// verifies ownership before showing the item. Background: docs/findings/02-idor.md
//
// Comments are stored as text and escaped by EJS at render time (<%= %>),
// so there is no stored XSS in this version.
// ---------------------------------------------------------------------------
const express = require('express');
const db = require('../db/db');
const requireLogin = require('../middleware/requireLogin');

const router = express.Router();

// Dashboard: shows only the logged-in user's own items.
router.get('/dashboard', requireLogin, (req, res) => {
  const items = db
    .prepare('SELECT * FROM items WHERE owner_id = ? ORDER BY created_at DESC')
    .all(req.session.userId);
  res.render('dashboard', { items });
});

// Single item + comments.
router.get('/items/:id', requireLogin, (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);

  if (!item) return res.status(404).render('404');

  // Ownership check — fix for IDOR. Only the owner (or an admin) may view it.
  const isOwner = item.owner_id === req.session.userId;
  const isAdmin = req.session.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).render('403');
  }

  const comments = db
    .prepare(
      `SELECT c.content, c.created_at, u.username
         FROM comments c JOIN users u ON u.id = c.author_id
        WHERE c.item_id = ? ORDER BY c.created_at ASC`
    )
    .all(item.id);

  res.render('item', { item, comments });
});

// Add a comment.
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
