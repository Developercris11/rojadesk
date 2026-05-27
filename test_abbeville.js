async function testAbbeville() {
    try {
        console.log('Testing City of Abbeville, Alabama lookup...\n');
        
        // Test using http (built-in fetch in Node)
        const response = await fetch('http://localhost:3000/api/agency-information', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agencyName: 'City of Abbeville',
                state: 'AL',
                zipCode: '36310'
            })
        });
        
        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('\n=== Response Data ===');
        console.log(JSON.stringify(data, null, 2));
        
        console.log('\n=== Results ===');
        
        // Check if it found the website
        if (data.officialWebsite) {
            console.log('✓ Official Website Found:', data.officialWebsite);
        } else {
            console.log('✗ No official website found');
            if (data.errors) {
                console.log('Errors:', data.errors);
            }
        }
        
        console.log('\n✓ Trustworthy Data Found:', data.trustworthyDataFound ? 'YES' : 'NO');
        
        // Show extracted contacts if any
        if (data.contacts && Object.keys(data.contacts).length > 0) {
            console.log('\n✓ Contacts Found:');
            for (const [role, contact] of Object.entries(data.contacts)) {
                if (contact && typeof contact === 'object' && contact.fullName) {
                    console.log(`  - ${role}: ${contact.fullName}`);
                }
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testAbbeville();
