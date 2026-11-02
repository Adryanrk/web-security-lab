# 02 — Insecure Direct Object Reference / IDOR (OWASP A01)

**Allvarlighetsgrad:** Hög
**Plats:** `routes/items.js` — `GET /items/:id`

## Sammanfattning
Sidan för en enskild item hämtar objektet direkt från id:t i URL:en och visar
det utan att kontrollera om den inloggade användaren äger det. Vilken inloggad
användare som helst kan därför läsa alla andras privata items genom att ändra
siffran i adressen.

## Sårbar kod
```js
router.get('/items/:id', requireLogin, (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).render('404');
  // ingen kontroll av ÄGANDE här -> IDOR
  const comments = /* ... */;
  res.render('item', { item, comments });
});
```
`requireLogin` kontrollerar bara *att* någon är inloggad — inte *vem*. Själva
auktoriseringen (äger du det här objektet?) saknas.

## Så utnyttjas det (steg för steg)
1. Logga in som **alice** (`alice` / `alice123`).
2. På dashboarden ser du bara Alices egen item. Klicka in på den — URL:en blir
   t.ex. `/items/1`.
3. Ändra siffran i adressfältet manuellt:
   - `/items/2` → Bobs "Bobs inköpslista"
   - `/items/3` → admins "Driftnotis"
4. Du läser andra användares privata innehåll trots att du inte äger det och
   trots att det aldrig visades i ditt gränssnitt.

*(Infoga skärmdump: inloggad som alice men tittar på admins item #3.)*

## Påverkan (impact)
- Horisontell behörighetseskalering: en vanlig användare läser andra
  användares data.
- Går ofta att automatisera — en angripare kan loopa igenom `/items/1..N` och
  dra ut hela databasens innehåll objekt för objekt.
- I verkliga appar drabbar samma mönster ofta känsliga resurser: fakturor,
  meddelanden, journaler, konto-API:er.

Klassas som **Hög**.

## Rotorsak
Autentisering (vem är du?) blandas ihop med auktorisering (vad får du göra?).
Appen autentiserar men auktoriserar inte per objekt. Att ett id inte visas i
gränssnittet är inte skydd — URL:en kan alltid gissas eller räknas upp
("security by obscurity" fungerar inte).

## Åtgärd (remediation)
Kontrollera ägande på varje förfrågan, efter att objektet hämtats:
```js
const isOwner = item.owner_id === req.session.userId;
const isAdmin = req.session.role === 'admin';
if (!isOwner && !isAdmin) {
  return res.status(403).render('403');
}
```
Princip: verifiera alltid att den inloggade användaren har rätt till just det
begärda objektet. Överväg även oförutsägbara identifierare (t.ex. UUID) så att
id:n inte trivialt kan räknas upp — men det ersätter aldrig behörighetskollen,
det kompletterar den.

## Referens
OWASP A01:2021 — Broken Access Control · https://owasp.org/Top10/A01_2021-Broken_Access_Control/
