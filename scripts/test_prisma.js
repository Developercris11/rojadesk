const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
    const prisma = new PrismaClient();
    try {
        console.log('Attempting to connect to Prisma...');
        const count = await prisma.lead.count();
        console.log(`Successfully connected. Lead count: ${count}`);
    } catch (error) {
        console.error('Prisma connection failed:', error.message);
        if (error.message.includes('Can\'t find schema.prisma')) {
            console.log('TIP: Try running npx prisma generate');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testPrisma();
