# Metodik

Testningen följer ett förenklat men realistiskt pentest-flöde. Varje
sårbarhet dokumenteras med samma struktur i `findings/` så rapporten blir
konsekvent.

## Faser
1. **Recon / kartläggning** — gå igenom alla sidor, formulär, URL-parametrar
   och API-anrop. Notera var användarinput tas emot (det är attackytan).
2. **Identifiering** — ställ hypoteser: "det här fältet går kanske direkt in
   i en SQL-query", "det här id:t i URL:en kanske inte behörighetskontrolleras".
3. **Exploatering** — bekräfta hypotesen med ett konkret angrepp.
4. **Verifiering** — visa påverkan (impact): vad kan en angripare faktiskt
   komma åt eller göra?
5. **Åtgärd (remediation)** — fixa hålet i koden och visa att angreppet
   inte längre fungerar.
6. **Dokumentation** — skriv upp det hela medan det är färskt.

## Verktyg
- **Burp Suite Community** eller **OWASP ZAP** — avlyssnande proxy mellan
  webbläsare och app. Används för att läsa och manipulera requests.
- **Webbläsarens DevTools** — nätverksflik, cookies, konsol.
- **curl** — för att snabbt återskapa en request från terminalen.

## Allvarlighetsgrad (severity)
Varje fynd klassas för att spegla en riktig rapport:

| Grad     | Innebörd (ungefär)                                   |
|----------|------------------------------------------------------|
| Kritisk  | Full kompromettering / åtkomst till all data         |
| Hög      | Åtkomst till annan användares data eller konto        |
| Medel    | Begränsad exponering, kräver viss förutsättning       |
| Låg      | Informationsläckage med liten direkt påverkan         |

## Writeup-mall
Se `findings/_TEMPLATE.md`.
