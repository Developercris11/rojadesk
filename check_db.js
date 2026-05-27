const Database = require('better-sqlite3');
const db = new Database('c:/Users/csmar/Documents/RojaDesk/prisma/dev.db');
const row = db.prepare("SELECT count(*) as count FROM Lead WHERE state = 'UT'").get();
console.log(`UT Lead Count: ${row.count}`);
db.close();
