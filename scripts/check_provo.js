import prisma from './src/lib/prisma.js';

async function checkProvoLeads() {
    try {
        const leads = await prisma.lead.findMany({
            where: {
                OR: [
                    { city: 'Provo' },
                    { city: 'provo' }
                ]
            },
            take: 10
        });

        console.log(`Found ${leads.length} leads in Provo.`);
        leads.forEach(l => {
            console.log(`- ${l.companyName} (${l.phoneNumber}) [Category: ${l.category}, City: ${l.city}]`);
        });

        const totalCount = await prisma.lead.count({
            where: {
                OR: [
                    { city: 'Provo' },
                    { city: 'provo' }
                ]
            }
        });
        console.log(`Total leads in Provo: ${totalCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProvoLeads();
