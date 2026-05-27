const axios = require('axios');

async function testBulkDelete() {
    // First, let's get some IDs from the DB
    const Database = require('better-sqlite3');
    const db = new Database('./prisma/dev.db');
    const members = db.prepare('SELECT id FROM TeamMember LIMIT 3').all();
    db.close();

    if (members.length === 0) {
        console.log('No members found to delete.');
        return;
    }

    const ids = members.map(m => m.id);
    console.log('Attempting to delete IDs:', ids);

    try {
        const response = await axios.delete('http://localhost:3000/api/teams/bulk', {
            data: { ids }
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testBulkDelete();
