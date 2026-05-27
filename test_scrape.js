const cheerio = require('cheerio');

async function run() {
    const response = await fetch('https://adamstennessee.net/local-government/', { 
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        }
    });
    
    if (!response.ok) {
        console.log("NOT OK", response.status);
        return;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // We were checking footerText:
    const footerText = $('footer').text() || $('div#footer').text() || $('.footer').text() || $('body').text().substring(0, 5000);
    
    console.log("--- FOOTER/BODY TEXT (first 300 chars) ---");
    console.log(footerText.substring(0, 300));
    
    console.log("\n--- REGEX MATCHING ---");
    const regex = /([A-Z]{2}|[A-Z][a-z]+[\sA-Za-z]*)[\s,]+(\d{5}(?:-\d{4})?)/;
    const stateZipMatch = footerText.match(regex);
    console.log("State/Zip Match:", stateZipMatch ? stateZipMatch.slice(0, 3) : null);
    
    if (stateZipMatch) {
         const streetMatch = footerText.match(/(?:P\.O\.\s*Box\s*\d+|PO\s*Box\s*\d+|\d+\s+[A-Za-z0-9\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Way|Court|Ct|Pl|Place|Sq|Square|Pkwy|Parkway|Highway|Hwy))[,\s\.]?\s/i);
         console.log("Street Match:", streetMatch ? streetMatch[0] : null);
         
         const beforeState = footerText.substring(Math.max(0, stateZipMatch.index - 50), stateZipMatch.index);
         const cityMatch = beforeState.match(/([A-Za-z\s\.]+)[,\s]+$/);
         console.log("City Match:", cityMatch ? cityMatch[1] : null);
    }
    
    console.log("\n--- FINDING PEOPLE ---");
    $('tr, .staff-member, .directory-item, .contact-block, div, p').each((_, el) => {
        const text = $(el).text();
        if (text.includes("Mayor") || text.includes("City Manager")) {
             console.log("Found block with title, length:", text.length);
             if (text.length < 500) {
                 console.log("TEXT:", text.replace(/\s+/g, ' '));
             }
        }
    });
}
run();
