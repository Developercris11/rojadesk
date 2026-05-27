const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const fs = require('fs');
const path = require('path');

// Use the same adapter configuration as the project
const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db'
});

const prisma = new PrismaClient({
  adapter: adapter
});

async function importAlabamaMunicipalities() {
    console.log('📍 IMPORTING ALABAMA MUNICIPALITIES TO DATABASE\n');
    
    try {
        // Read the JSON file
        const jsonFile = path.join(process.cwd(), 'alm_alabama_municipalities.json');
        
        if (!fs.existsSync(jsonFile)) {
            console.error('❌ Error: alm_alabama_municipalities.json not found');
            console.log('Please make sure the file exists in the current directory');
            process.exit(1);
        }
        
        const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
        const municipalities = data.municipalities;
        
        console.log(`Found ${municipalities.length} municipalities to import\n`);
        
        // Import data
        let successCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (const muni of municipalities) {
            try {
                // Clean up the name - remove extra whitespace
                const cleanName = muni.name.trim().replace(/\s+/g, ' ');
                
                // Check if already exists
                const existing = await prisma.alabamaMunicipality.findUnique({
                    where: { name: cleanName }
                });
                
                if (existing) {
                    duplicateCount++;
                    continue;
                }
                
                // Create the municipality
                await prisma.alabamaMunicipality.create({
                    data: {
                        name: cleanName,
                        email: muni.email || null,
                        phone: muni.phone || null,
                        website: muni.website || null,
                        source: 'ALM',
                        dataImport: 'ALM Municipality Directory'
                    }
                });
                
                successCount++;
                
                // Log progress
                if ((successCount + duplicateCount + errorCount) % 50 === 0) {
                    console.log(`  Progress: ${successCount + duplicateCount + errorCount}/${municipalities.length}...`);
                }
                
            } catch (error) {
                errorCount++;
                errors.push({
                    name: muni.name,
                    error: error.message
                });
                
                // Log unique constraint violations as duplicates
                if (error.code === 'P2002') {
                    duplicateCount++;
                    errorCount--;
                }
            }
        }
        
        // Get final database count
        const totalInDb = await prisma.alabamaMunicipality.count();
        
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
        
        // Show sample of imported data
        console.log(`\nSample imported municipalities:`);
        const samples = await prisma.alabamaMunicipality.findMany({
            take: 5,
            orderBy: { name: 'asc' }
        });
        
        samples.forEach(m => {
            console.log(`   • ${m.name}`);
            if (m.email) console.log(`     ✉ ${m.email}`);
            if (m.phone) console.log(`     ☎ ${m.phone}`);
        });
        
    } catch (error) {
        console.error('Fatal error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

importAlabamaMunicipalities();
