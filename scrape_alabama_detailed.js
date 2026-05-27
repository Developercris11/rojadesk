const fs = require('fs');
const https = require('https');
const cheerio = require('cheerio');

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

async function scrapeAlabamaCities() {
    console.log('📍 ALABAMA CITY OFFICIALS SCRAPER\n');
    
    try {
        // Step 1: Extract all city links from the list page
        console.log('Step 1: Fetching city list...');
        const listUrl = 'https://www.sos.alabama.gov/city-county-lookup/cities';
        const listHtml = await fetchUrl(listUrl);
        const $ = cheerio.load(listHtml);
        
        const cities = [];
        $('div.city').each((i, el) => {
            const link = $(el).find('a');
            const name = link.text().trim();
            const href = link.attr('href');
            if (name && href) {
                cities.push({
                    name: name,
                    url: `https://www.sos.alabama.gov${href}`,
                    slug: href.replace('/city-county-lookup/', '')
                });
            }
        });
        
        console.log(`✅ Found ${cities.length} cities\n`);
        console.log('Cities list:');
        cities.slice(0, 20).forEach(city => {
            console.log(`  - ${city.name}`);
        });
        console.log(`  ... and ${cities.length - 20} more\n`);
        
        // Save city list
        const cityListData = {
            scrapedAt: new Date().toISOString(),
            count: cities.length,
            cities: cities.map(c => ({ name: c.name, slug: c.slug }))
        };
        fs.writeFileSync('alabama_cities_list.json', JSON.stringify(cityListData, null, 2));
        console.log('✅ Saved cities list to alabama_cities_list.json\n');
        
        // Step 2: Fetch details for first few cities to understand the structure
        console.log('Step 2: Fetching city official details...\n');
        const citiesWithOfficials = [];
        
        // Fetch details for first 5 cities as example
        for (let i = 0; i < Math.min(5, cities.length); i++) {
            const city = cities[i];
            console.log(`  Fetching: ${city.name}...`);
            
            try {
                const detailHtml = await fetchUrl(city.url);
                const detail$ = cheerio.load(detailHtml);
                
                // Extract city officials
                const officials = [];
                
                // Look for official information in the page
                // Try different selectors for official tables/listings
                const rows = detail$('tr, .official-row, [class*="official"]');
                
                // Extract text content and look for name/title patterns
                const pageText = detail$('body').text();
                
                // Simple extraction: look for capitalized names and titles
                const lines = pageText.split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 0 && l.length < 100);
                
                // Extract officials (basic pattern matching)
                for (let j = 0; j < lines.length; j++) {
                    const line = lines[j];
                    
                    // Look for patterns like "Name - Title" or "Title: Name"
                    if (line.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+\s+[-–]/i) || 
                        line.match(/\b(Mayor|City Manager|Clerk|Treasurer|Administrator)\b/i)) {
                        officials.push(line);
                    }
                }
                
                citiesWithOfficials.push({
                    name: city.name,
                    slug: city.slug,
                    url: city.url,
                    officialsCount: officials.length,
                    officials: officials.slice(0, 10) // Limit to first 10
                });
                
                console.log(`    Found ${officials.length} potential official entries`);
                if (officials.length > 0) {
                    console.log(`    Sample: ${officials[0]}`);
                }
                
            } catch (error) {
                console.log(`    Error fetching: ${error.message}`);
            }
            
            // Small delay between requests
            await new Promise(r => setTimeout(r, 500));
        }
        
        // Save detailed data
        const detailData = {
            scrapedAt: new Date().toISOString(),
            cityCount: citiesWithOfficials.length,
            cities: citiesWithOfficials
        };
        fs.writeFileSync('alabama_cities_officials_sample.json', JSON.stringify(detailData, null, 2));
        console.log('\n✅ Saved sample city officials to alabama_cities_officials_sample.json');
        
        // Summary
        console.log('\n=== SUMMARY ===');
        console.log(`Total cities found: ${cities.length}`);
        console.log(`Sample detail fetch: ${citiesWithOfficials.length} cities`);
        console.log('\nNext steps:');
        console.log('1. Review alabama_cities_list.json for all cities');
        console.log('2. Review alabama_cities_officials_sample.json for data structure');
        console.log('3. Refine official extraction logic based on actual page structure');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

scrapeAlabamaCities();
