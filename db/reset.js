// db/reset.js
// Raderar databasfilerna så nästa start seedar om från noll.
// Kör med: npm run reset-db
const fs = require('fs');
const path = require('path');

for (const f of ['lab.db', 'lab.db-wal', 'lab.db-shm']) {
  const p = path.join(__dirname, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('Raderade', f);
  }
}
console.log('Klart. Starta appen igen för att seeda om.');
