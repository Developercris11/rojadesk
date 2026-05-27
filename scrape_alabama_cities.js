const https = require('https');
const cheerio = require('cheerio');

// Disable SSL verification for self-signed certs
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

async function scrapAlabamaCities() {
    try {
        const url = 'https://www.sos.alabama.gov/city-county-lookup/cities';
        console.log('Fetching:', url);
        const html = await fetchUrl(url);
        
        console.log('✅ Page fetched. Length:', html.length);
        
        // Save HTML for inspection
        require('fs').writeFileSync('alabama_page.html', html);
        
        // Print first 2000 chars
        console.log('\n=== FIRST 2000 CHARACTERS ===\n');
        console.log(html.substring(0, 2000));
        
        // Look for table or list structure
        const $ = cheerio.load(html);
        
        // Find all tables
        console.log('\n=== TABLES FOUND ===');
        const tables = $('table');
        console.log('Number of tables:', tables.length);
        
        if (tables.length > 0) {
            tables.slice(0, 2).each((i, table) => {
                console.log(`\nTable ${i+1}:`);
                const rows = $(table).find('tr');
                console.log(`  Rows: ${rows.length}`);
                rows.slice(0, 3).each((j, row) => {
                    const cells = $(row).find('td, th');
                    const text = cells.map((_, cell) => $(cell).text().trim()).get().join(' | ');
                    console.log(`    Row ${j+1}: ${text.substring(0, 100)}`);
                });
            });
        }
        
        // Find all divs and spans that might contain city names
        console.log('\n=== PAGE BODY STRUCTURE ===');
        const main = $('main, [role="main"], .content, .main-content');
        if (main.length > 0) {
            console.log('Found main content area:', main.attr('class'));
            const text = main.text().substring(0, 500);
            console.log('Content preview:', text);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

scrapAlabamaCities();
