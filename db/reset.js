// db/reset.js
// Deletes the database files so the next start re-seeds from scratch.
// Run with: npm run reset-db
const fs = require('fs');
const path = require('path');

for (const f of ['lab.db', 'lab.db-wal', 'lab.db-shm']) {
  const p = path.join(__dirname, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('Deleted', f);
  }
}
console.log('Done. Start the app again to re-seed.');
