const https = require('https');
const http = require('http');
const cheerio = require('cheerio');
const fs = require('fs');

// Disable SSL verification
https.globalAgent = new https.Agent({
    rejectUnauthorized: false
});

function fetchUrl(urlStr) {
    return new Promise((resolve, reject) => {
        const protocol = urlStr.startsWith('https') ? https : http;
        
        protocol.get(urlStr, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            rejectUnauthorized: false,
            timeout: 10000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function analyzeALMSite() {
    console.log('📍 ANALYZING ALABAMA LEAGUE OF MUNICIPALITIES DIRECTORY\n');
    
    try {
        const url = 'https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx';
        console.log(`Fetching: ${url}\n`);
        
        const html = await fetchUrl(url);
        
        // Save HTML for inspection
        fs.writeFileSync('alm_directory.html', html);
        console.log('✅ Saved HTML to alm_directory.html\n');
        
        const $ = cheerio.load(html);
        
        // Analyze structure
        console.log('=== PAGE STRUCTURE ===\n');
        
        // Look for tables
        const tables = $('table');
        console.log(`Found ${tables.length} tables`);
        
        if (tables.length > 0) {
            console.log('\n--- TABLE 1 Preview ---');
            const firstTable = tables.eq(0);
            const rows = firstTable.find('tr').slice(0, 5);
            
            rows.each((idx, row) => {
                const cells = $(row).find('td, th');
                const cellTexts = [];
                cells.each((cidx, cell) => {
                    const text = $(cell).text().trim();
                    if (text) cellTexts.push(text.substring(0, 50));
                });
                console.log(`Row ${idx}: ${cellTexts.join(' | ')}`);
            });
        }
        
        // Look for divs with municipality info
        console.log('\n\n=== MUNICIPALITY ENTRIES ===\n');
        
        const muniDivs = $('div[class*="municipal"], div[class*="city"], div[class*="entry"], li');
        console.log(`Found ${muniDivs.length} potential municipality elements\n`);
        
        // Get text containing city names (first 20 lines that might be cities)
        const bodyText = $('body').text();
        const lines = bodyText.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 3 && l.length < 80);
        
        console.log('First 30 text lines:');
        lines.slice(0, 30).forEach((line, idx) => {
            console.log(`${idx}: ${line}`);
        });
        
        // Search for keywords
        console.log('\n\n=== KEYWORD SEARCH ===\n');
        const keywords = ['Mayor', 'City Manager', 'Municipal', 'Directory', 'Contact', 'phone', 'email'];
        
        keywords.forEach(kw => {
            const count = (bodyText.match(new RegExp(kw, 'gi')) || []).length;
            console.log(`"${kw}": ${count} occurrences`);
        });
        
        // Look for city names (Alabama cities start with specific prefixes)
        console.log('\n\n=== POTENTIAL CITY NAMES ===\n');
        
        const cityStarters = ['Abbeville', 'Alabama', 'Alexander', 'Albertville', 'Auburn', 'Bessemer', 'Birmingham', 'Cullman', 'Daphne', 'Dothan', 'Gadsden', 'Huntsville', 'Madison', 'Mobile', 'Montgomery', 'Opelika', 'Phenix Cities'];
        
        cityStarters.forEach(city => {
            if (bodyText.includes(city)) {
                console.log(`✓ Found: ${city}`);
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

analyzeALMSite();
