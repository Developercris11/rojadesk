const cheerio = require('cheerio');

async function test() {
    const url = 'https://adamstennessee.net/local-government/';
    const response = await fetch(url, { 
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html',
        }
    });
    
    if (!response.ok) {
        console.log('Status:', response.status);
        return;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove scripts and styles
    $('script, style').remove();
    
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    console.log('Body Text length:', bodyText.length);
    console.log('Body Text Preview:', bodyText.substring(0, 1000));
}

test();
