const Database = require('better-sqlite3');
const path = require('path');

async function migrate() {
    const dbPath = path.join(__dirname, 'prisma', 'dev.db');
    console.log(`Connecting to database at ${dbPath}...`);
    const db = new Database(dbPath);

    try {
        // Check if column exists
        const info = db.prepare("PRAGMA table_info(Lead)").all();
        const hasSource = info.some(c => c.name === 'source');

        if (!hasSource) {
            console.log("Adding 'source' column to Lead table...");
            db.prepare("ALTER TABLE Lead ADD COLUMN source TEXT NOT NULL DEFAULT 'PROSPECTOR'").run();
            console.log("Adding index for 'source' column...");
            db.prepare("CREATE INDEX IF NOT EXISTS lead_source_idx ON Lead(source)").run();
            console.log("Migration successful!");
        } else {
            console.log("'source' column already exists.");
        }
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        db.close();
    }
}

migrate();
