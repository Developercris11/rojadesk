const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('alabama_page.html', 'utf-8');
const $ = cheerio.load(html);

console.log('=== ANALYZING ALABAMA CITIES PAGE ===\n');

// Look for city links or names
console.log('=== LOOKING FOR CITY LINKS ===');
const allLinks = $('a');
const cityLinks = allLinks.filter((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    return href && (href.includes('city') || href.includes('official') || text.length < 30);
}).slice(0, 20);

console.log(`Found ${allLinks.length} total links, showing first 20 city-related:`);
cityLinks.each((i, el) => {
    console.log(`  ${i+1}. "${$(el).text().trim()}" -> ${$(el).attr('href')}`);
});

// Look for divs and structure
console.log('\n=== BODY TEXT STRUCTURE ===');
const bodyText = $('body').text();
const lines = bodyText.split('\n').filter(l => l.trim().length > 0 && l.trim().length < 50).slice(50, 100);
console.log('Lines 50-100:');
lines.forEach((line, i) => {
    console.log(`  ${i+51}. "${line.trim()}"`);
});

// Check if this is a search/filter page
console.log('\n=== FORM ELEMENTS ===');
const forms = $('form');
const inputs = $('input');
const selects = $('select');
console.log('Forms:', forms.length);
console.log('Input fields:', inputs.length);
console.log('Select dropdowns:', selects.length);

// Check for JSON data in script tags
console.log('\n=== CHECKING FOR DATA IN SCRIPTS ===');
const scripts = $('script:not([src])');
let foundData = false;
scripts.each((i, el) => {
    const text = $(el).html();
    if (text && text.includes('Abbeville')) {
        console.log('✅ Found city data in script tag!');
        // Show a sample
        const start = text.indexOf('Abbeville') - 100;
        const end = text.indexOf('Abbeville') + 200;
        console.log(text.substring(Math.max(0, start), end));
        foundData = true;
    }
});

if (!foundData) {
    console.log('No city data found in script tags');
}

// Check page title and meta
console.log('\n=== PAGE INFO ===');
console.log('Title:', $('title').text());
console.log('Meta description:', $('meta[name="description"]').attr('content'));
