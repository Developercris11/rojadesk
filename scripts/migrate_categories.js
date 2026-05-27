const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

async function migrateLeads() {
    const sqlite = new Database('prisma/dev.db');
    const adapter = new PrismaBetterSqlite3(sqlite);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('Migrating leads in Lindon from "General" or "Used Car Dealer" to "Motor Pool"...');
        
        const result = await prisma.lead.updateMany({
            where: {
                city: 'Lindon',
                category: {
                    in: ['General', 'Used Car Dealer', 'Used car dealer']
                }
            },
            data: {
                category: 'Motor Pool'
            }
        });

        console.log(`Successfully updated ${result.count} leads.`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateLeads();
