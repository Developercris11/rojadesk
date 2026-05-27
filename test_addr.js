const cheerio = require('cheerio');

async function test() {
    const url = 'https://adamstennessee.net/local-government/';
    const response = await fetch(url, { 
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    });
    
    if (!response.ok) {
        console.log('Status:', response.status);
        return;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const footerText = $('footer').text() || $('div#footer').text() || $('.footer').text() || $('body').text().substring(0, 5000);
    console.log('Footer Text length:', footerText.length);
    
    const stateZipMatch = footerText.match(/([A-Z]{2}|[A-Z][a-z]+[\sA-Za-z]*)[\s,]+(\d{5}(?:-\d{4})?)/);
    console.log('State/Zip Match:', stateZipMatch ? stateZipMatch[0] : 'NONE');
    
    if (stateZipMatch) {
        const streetMatch = footerText.match(/(?:P\.O\.\s*Box\s*\d+|PO\s*Box\s*\d+|\d+\s+[A-Za-z0-9\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Way|Court|Ct|Pl|Place|Sq|Square|Pkwy|Parkway|Highway|Hwy))[,\s\.]?\s/i);
        console.log('Street Match:', streetMatch ? streetMatch[0] : 'NONE');
        
        const beforeState = footerText.substring(Math.max(0, stateZipMatch.index - 50), stateZipMatch.index);
        const cityMatch = beforeState.match(/([A-Za-z\s\.]+)[,\s]+$/);
        console.log('City Match:', cityMatch ? cityMatch[1] : 'NONE');
    }
    
    // Check for organization name
    const orgNameMatch = $('body').text().match(/City of\s+([A-Z][a-z]+)/i) || $('body').text().match(/Town of\s+([A-Z][a-z]+)/i);
    console.log('Org Name Match:', orgNameMatch ? orgNameMatch[0] : 'NONE');
}

test();
