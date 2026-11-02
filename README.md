# SecureFolio — Security Lab (avsiktligt sårbar medlemsportal)

> ⚠️ **Säkerhetsvarning**
> Den här appen innehåller **med avsikt** inlagda säkerhetshål och är byggd
> enbart för **lokal, isolerad** inlärning och testning på min egen maskin.
> Den ska **aldrig** driftsättas, exponeras mot internet, eller köras mot
> system eller data jag inte äger. Allt pentest-arbete i detta repo sker mot
> den här appen, lokalt.

Ett hands-on säkerhetslabb där jag bygger en realistisk webbapp, demonstrerar
hur klassiska sårbarheter (OWASP Top 10) uppstår och utnyttjas, och visar hur
de åtgärdas — med dokumentation och en pentest-rapport som slutleverans.

## Varför två versioner
Appen byggs först **säker** (parametriserade queries, bcrypt, access-kontroll).
Sårbarheterna läggs sedan in **medvetet**, en i taget, så att den säkra och
den sårbara varianten kan jämföras rad för rad. Det är själva poängen med
labbet: att förstå *varför* något är ett hål, inte bara att det är det.

## Teknik
- **Node.js + Express** — backend och routing
- **SQLite** (Nodes inbyggda `node:sqlite`) — databas i en enda fil, inget byggsteg
- **EJS** — serverrenderade vyer
- **bcryptjs** — lösenordshashning
- **express-session** — sessionshantering

## Kör lokalt
```bash
npm install
npm start
# öppna http://localhost:3000
```
Testkonton seedas automatiskt:

| Användare | Lösenord     | Roll  |
|-----------|--------------|-------|
| alice     | alice123     | user  |
| bob       | bob123       | user  |
| admin     | Admin!2026   | admin |

Nollställ databasen när som helst med `npm run reset-db`.

## Sårbarheter som demonstreras (OWASP Top 10)
Bockas av allt eftersom varje writeup skrivs i `docs/findings/`.

- [x] A01 — Broken Access Control (IDOR på `/items/:id`) → `docs/findings/02-idor.md`
- [ ] A02 — Cryptographic Failures (svag/ingen lösenordshashning)
- [x] A03 — Injection (SQL-injection i inloggningen) → `docs/findings/01-sql-injection.md`
- [ ] A03 — Stored XSS (profil-bio / kommentarer)
- [ ] A05 — Security Misconfiguration (läckande felmeddelanden)
- [ ] A07 — Identification & Authentication Failures (ingen rate limiting)

## Struktur
```
security-lab-vulnerable-app/
├── app  (server.js, routes/, views/, db/, middleware/)
├── docs/
│   ├── architecture.md      arkitektur & dataflöde
│   ├── methodology.md       hur testningen går till
│   └── findings/            en writeup per sårbarhet
└── report/                  slutlig pentest-rapport (PDF)
```

## Metod i korthet
Recon → identifiera attackytor → utnyttja → verifiera → åtgärda → dokumentera.
Verktyg: Burp Suite Community / OWASP ZAP som proxy, plus webbläsaren.

## Ansvarsfriskrivning
Byggd i utbildningssyfte som en del av mitt portfolio inom cybersäkerhet.
Använd aldrig teknikerna häri mot system du inte har uttryckligt tillstånd att testa.
