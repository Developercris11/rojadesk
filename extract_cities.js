const fs = require('fs');
const html = fs.readFileSync('alabama_page.html', 'utf-8');

// Find all occurrences of city names
const cityPattern = /(?:<div[^>]*>\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:<\/div>)?/g;

// Look for the section with cities
const citiesStart = html.indexOf('Abbeville');
if (citiesStart > 0) {
    console.log('Found Abbeville at position:', citiesStart);
    console.log('\n=== CONTEXT AROUND ABBEVILLE (500 chars before and after) ===\n');
    const start = Math.max(0, citiesStart - 500);
    const end = Math.min(html.length, citiesStart + 500);
    console.log(html.substring(start, end));
    console.log('\n');
}

// Extract all city-like entries
console.log('=== EXTRACTING CITY NAMES ===');
const cityMatch = html.match(/Abbeville[\s\S]*?Autaugaville/);
if (cityMatch) {
    const section = cityMatch[0];
    const cities = section.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
    if (cities) {
        console.log(`Found ${cities.length} cities in range:`);
        cities.slice(0, 50).forEach((city, i) => {
            console.log(`  ${i+1}. ${city}`);
        });
    }
}
