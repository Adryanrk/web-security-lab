# 02 — Insecure Direct Object Reference / IDOR (OWASP A01)

**Severity:** High
**Location:** `routes/items.js` — `GET /items/:id`

## Summary
The single-item page fetches the object directly from the id in the URL and
shows it without checking whether the logged-in user owns it. Any authenticated
user can therefore read everyone else's private items by changing the number in
the address.

## Vulnerable code
```js
router.get('/items/:id', requireLogin, (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).render('404');
  // no ownership check here -> IDOR
  const comments = /* ... */;
  res.render('item', { item, comments });
});
```
`requireLogin` only checks *that* someone is logged in — not *who*. The
authorization step (do you own this object?) is missing.

## How it is exploited (step by step)
1. Log in as **alice** (`alice` / `alice123`).
2. On the dashboard you only see Alice's own item. Open it — the URL becomes
   e.g. `/items/1`.
3. Change the number in the address bar manually:
   - `/items/2` → Bob's "Bob's shopping list"
   - `/items/3` → admin's "Ops notice"
4. You read other users' private content even though you do not own it and even
   though it was never shown in your interface.

*(Insert screenshot: logged in as alice but viewing admin's item #3.)*

## Impact
- Horizontal privilege escalation: an ordinary user reads other users' data.
- Often automatable — an attacker can loop over `/items/1..N` and extract the
  entire database content object by object.
- In real apps the same pattern frequently affects sensitive resources:
  invoices, messages, records, account APIs.

Rated **High**.

## Root cause
Authentication (who are you?) is confused with authorization (what are you
allowed to do?). The app authenticates but does not authorize per object. An id
not being shown in the interface is not protection — the URL can always be
guessed or enumerated ("security by obscurity" does not work).

## Remediation
Check ownership on every request, after fetching the object:
```js
const isOwner = item.owner_id === req.session.userId;
const isAdmin = req.session.role === 'admin';
if (!isOwner && !isAdmin) {
  return res.status(403).render('403');
}
```
Principle: always verify that the logged-in user is entitled to the specific
object requested. Consider unpredictable identifiers (e.g. UUIDs) so ids cannot
trivially be enumerated — but that never replaces the authorization check, it
complements it.

## Reference
OWASP A01:2021 — Broken Access Control · https://owasp.org/Top10/A01_2021-Broken_Access_Control/
