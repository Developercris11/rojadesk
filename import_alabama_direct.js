const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

async function importAlabamaMunicipalities() {
    console.log('📍 IMPORTING ALABAMA MUNICIPALITIES TO DATABASE\n');
    
    try {
        // Initialize database
        const dbPath = path.join(__dirname, 'prisma', 'dev.db');
        const db = new Database(dbPath);
        
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        
        // Create table if it doesn't exist
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS "AlabamaMunicipality" (
                "id"         TEXT NOT NULL PRIMARY KEY,
                "name"       TEXT NOT NULL UNIQUE,
                "email"      TEXT,
                "phone"      TEXT,
                "website"    TEXT,
                "source"     TEXT NOT NULL DEFAULT 'ALM',
                "dataImport" TEXT NOT NULL DEFAULT 'ALM Municipality Directory',
                "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        db.exec(createTableSQL);
        console.log('✅ Table created/verified\n');
        
        // Read the JSON file
        const jsonFile = path.join(__dirname, 'alm_alabama_municipalities.json');
        
        if (!fs.existsSync(jsonFile)) {
            console.error('❌ Error: alm_alabama_municipalities.json not found');
            process.exit(1);
        }
        
        const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
        const municipalities = data.municipalities;
        
        console.log(`Found ${municipalities.length} municipalities to import\n`);
        
        // Prepare insert statement
        const insertStmt = db.prepare(`
            INSERT INTO "AlabamaMunicipality" (id, name, email, phone, website, source, dataImport, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `);
        
        // Import data
        let successCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // Generate CUID-like IDs
        function generateId() {
            return 'c' + Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
        }
        
        for (const muni of municipalities) {
            try {
                const cleanName = muni.name.trim().replace(/\s+/g, ' ');
                const id = generateId();
                
                insertStmt.run(
                    id,
                    cleanName,
                    muni.email || null,
                    muni.phone || null,
                    muni.website || null,
                    'ALM',
                    'ALM Municipality Directory'
                );
                
                successCount++;
                
                if ((successCount + duplicateCount + errorCount) % 50 === 0) {
                    console.log(`  Progress: ${successCount + duplicateCount + errorCount}/${municipalities.length}...`);
                }
                
            } catch (error) {
                // Check if it's a duplicate
                if (error.message.includes('UNIQUE constraint failed')) {
                    duplicateCount++;
                } else {
                    errorCount++;
                    errors.push({
                        name: muni.name,
                        error: error.message
                    });
                }
            }
        }
        
        // Get final count
        const countResult = db.prepare('SELECT COUNT(*) as count FROM "AlabamaMunicipality"').get();
        const totalInDb = countResult.count;
        
        console.log(`\n✅ IMPORT COMPLETE:\n`);
        console.log(`   New municipalities added: ${successCount}`);
        console.log(`   Duplicates skipped: ${duplicateCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Total in database: ${totalInDb}`);
        
        if (errors.length > 0 && errors.length <= 10) {
            console.log(`\nErrors encountered:`);
            errors.forEach(err => {
                console.log(`   - ${err.name}: ${err.error}`);
            });
        }
        
        // Show samples
        console.log(`\nSample imported municipalities:`);
        const samples = db.prepare('SELECT * FROM "AlabamaMunicipality" ORDER BY name LIMIT 5').all();
        
        samples.forEach(m => {
            console.log(`   • ${m.name}`);
            if (m.email) console.log(`     ✉ ${m.email}`);
            if (m.phone) console.log(`     ☎ ${m.phone}`);
        });
        
        db.close();
        console.log('\n✅ Database import completed successfully!');
        
    } catch (error) {
        console.error('Fatal error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

importAlabamaMunicipalities();
