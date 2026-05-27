const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');

// Disable SSL verification
https.globalAgent = new https.Agent({
    rejectUnauthorized: false
});

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            rejectUnauthorized: false
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function analyzeAbbeville() {
    console.log('📍 ANALYZING ABBEVILLE PAGE STRUCTURE\n');
    
    try {
        const url = 'https://www.sos.alabama.gov/city-county-lookup/abbeville';
        const html = await fetchUrl(url);
        
        // Save full HTML for manual inspection
        fs.writeFileSync('abbeville_page.html', html);
        console.log('✅ Saved full HTML to abbeville_page.html\n');
        
        const $ = cheerio.load(html);
        
        // Look at the structure
        console.log('=== PAGE STRUCTURE ANALYSIS ===\n');
        
        // Find all tables
        const tables = $('table');
        console.log(`Found ${tables.length} tables\n`);
        
        tables.each((idx, table) => {
            console.log(`\n--- TABLE ${idx + 1} ---`);
            const rows = $(table).find('tr');
            console.log(`Rows: ${rows.length}`);
            
            rows.slice(0, 15).each((ridx, row) => {
                const cells = $(row).find('td, th');
                const cellTexts = [];
                cells.each((cidx, cell) => {
                    cellTexts.push($(cell).text().trim());
                });
                console.log(`  [${ridx}] ${cellTexts.join(' | ')}`);
            });
            
            if (rows.length > 15) {
                console.log(`  ... and ${rows.length - 15} more rows`);
            }
        });
        
        // Look for divs with classes that might contain officials
        console.log('\n\n=== DIVS WITH POTENTIAL OFFICIAL INFO ===\n');
        const divs = $('div[class*="official"], div[class*="staff"], div[class*="contact"], div[class*="officer"]');
        console.log(`Found ${divs.length} divs with potential official classes\n`);
        
        divs.slice(0, 10).each((idx, div) => {
            console.log(`[${idx}] Classes: ${$(div).attr('class')}`);
            console.log(`    Content: ${$(div).text().trim().slice(0, 100)}`);
        });
        
        // Look at main content area
        console.log('\n\n=== MAIN CONTENT AREA ===\n');
        const mainContent = $('main, [role="main"], .content, .main-content, article').first();
        const mainText = mainContent.text();
        console.log('First 2000 characters of main content:');
        console.log(mainText.slice(0, 2000));
        
        // Search for specific official titles
        console.log('\n\n=== SEARCHING FOR OFFICIAL TITLES ===\n');
        const titles = ['Mayor', 'City Manager', 'City Clerk', 'City Administrator', 'Alderman', 'Councilman', 'Police Chief', 'Police', 'Circuit Clerk', 'County'];
        
        titles.forEach(title => {
            const regex = new RegExp(title, 'gi');
            const matches = mainText.match(regex);
            if (matches) {
                console.log(`Found "${title}": ${matches.length} times`);
            }
        });
        
        // Look for email patterns
        console.log('\n\n=== LOOKING FOR EMAIL/CONTACT INFO ===\n');
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = mainText.match(emailRegex);
        if (emails) {
            console.log(`Found ${emails.length} email addresses:`);
            [...new Set(emails)].slice(0, 10).forEach(email => {
                console.log(`  - ${email}`);
            });
        }
        
        // Phone numbers
        const phoneRegex = /\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;
        const phones = mainText.match(phoneRegex);
        if (phones) {
            console.log(`\nFound ${phones.length} phone numbers:`);
            [...new Set(phones)].slice(0, 10).forEach(phone => {
                console.log(`  - ${phone}`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

analyzeAbbeville();
