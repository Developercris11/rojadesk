const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');

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

async function testMultipleCities() {
    const cities = ['montgomery', 'birmingham', 'huntsville', 'mobile'];
    
    for (const city of cities) {
        console.log(`\n📍 Checking: ${city}`);
        try {
            const url = `https://www.sos.alabama.gov/city-county-lookup/${city}`;
            const html = await fetchUrl(url);
            const $ = cheerio.load(html);
            
            // Check for official-info divs
            const officialInfos = $('div.official-info');
            console.log(`  Officials found: ${officialInfos.length}`);
            
            // Get titles
            const titles = [];
            officialInfos.each((idx, el) => {
                const titleEl = $(el).find('h3, h2, .title, strong').first();
                const title = titleEl.text().trim() || $(el).text().match(/^[^(]*\n([^(]*)/)?.[1]?.trim() || '(untitled)';
                titles.push(title);
            });
            
            titles.unique = [...new Set(titles)];
            console.log(`  Titles: ${titles.unique.slice(0, 3).join(', ')}${titles.unique.length > 3 ? '...' : ''}`);
            
        } catch (err) {
            console.log(`  Error: ${err.message}`);
        }
        
        await new Promise(r => setTimeout(r, 500));
    }
}

testMultipleCities();
