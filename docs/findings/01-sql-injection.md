# 01 — SQL Injection i inloggningen (OWASP A03)

**Allvarlighetsgrad:** Kritisk
**Plats:** `routes/auth.js` — `POST /login`

## Sammanfattning
Inloggningsformuläret bygger sin SQL-fråga genom att konkatenera användarens
input direkt in i kommandosträngen. En angripare kan därför injicera SQL-syntax
och kringgå autentiseringen helt — logga in som vilken användare som helst,
inklusive admin, utan att känna till något lösenord.

## Sårbar kod
```js
const sql =
  "SELECT * FROM users WHERE username = '" + username +
  "' AND password = '" + password + "'";
const user = db.prepare(sql).get();
if (user) { /* inloggad */ }
```
Problemet: databasen kan inte skilja på kod (skriven av utvecklaren) och data
(skriven av användaren). Allt som skrivs i fälten blir en del av SQL-satsen.

## Så utnyttjas det (steg för steg)
1. Gå till `/login`.
2. Fyll i:
   - **Användarnamn:** `' OR 1=1 -- `
   - **Lösenord:** valfritt
3. Den sammansatta frågan blir:
   ```sql
   SELECT * FROM users WHERE username = '' OR 1=1 --' AND password = '...'
   ```
   - `' ` avslutar användarnamnssträngen i förtid
   - `OR 1=1` är alltid sant → villkoret matchar alla rader
   - `--` kommenterar bort resten av frågan (lösenordskontrollen)
4. Första raden i tabellen (admin) returneras → inloggad som **admin** utan lösenord.

Rikta mot en specifik användare:
- Användarnamn `admin' -- ` → inloggad som admin
- Användarnamn `alice' -- ` → inloggad som alice

Bekräfta att injektion är möjlig (felbaserad indikator):
- Användarnamn `'` (ensamt citattecken) → appen returnerar ett SQL-syntaxfel,
  vilket avslöjar att input tolkas som kod.

*(Infoga skärmdump: inloggad som admin efter payloaden.)*

## Påverkan (impact)
- Fullständig autentiseringsbypass — åtkomst till vilket konto som helst.
- Åtkomst till administratörskontot → all funktionalitet och data i portalen.
- Samma klass av fel kan ofta utökas till att läsa ut hela databasen
  (användarnamn, lösenord) via UNION- eller felbaserad injektion.

Därför klassas detta som **Kritiskt**.

## Not om denna miljö
Drivrutinen (`node:sqlite`) kör bara en sats per `prepare`, så s.k. "stacked
queries" (`'; DROP TABLE users; --`) körs inte här. Injektion *inom* den
enskilda SELECT-satsen (bypass, UNION) fungerar däremot fullt ut, vilket är
det vanligaste i praktiken.

## Åtgärd (remediation)
Använd en **parametriserad query** (prepared statement med platshållare):
```js
const user = db
  .prepare('SELECT * FROM users WHERE username = ?')
  .get(username);
if (!user || !bcrypt.compareSync(password || '', user.password)) {
  return res.render('login', { error: 'Fel användarnamn eller lösenord.' });
}
```
Varför det fungerar: med `?` skickas input alltid som ett **värde**, aldrig som
kod. Databasen kompilerar frågans struktur först och binder sedan in datan —
det går helt enkelt inte att "bryta ut" ur värdet. Lösenordet verifieras
dessutom separat med bcrypt istället för i SQL-satsen.

Kompletterande försvar: validera indata, kör databasanvändaren med minsta
möjliga rättigheter, och läck aldrig råa SQL-felmeddelanden till användaren.

## Referens
OWASP A03:2021 — Injection · https://owasp.org/Top10/A03_2021-Injection/
