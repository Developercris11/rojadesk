const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeALMDirectory() {
    console.log('📍 SCRAPING ALABAMA LEAGUE OF MUNICIPALITIES DIRECTORY\n');
    
    let browser;
    try {
        // Launch browser with ignore HTTPS errors
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        const page = await browser.newPage();
        
        // Disable SSL certificate checks
        page.on('error', err => console.log('Page crashed:', err));
        
        console.log('Loading ALM directory page...');
        await page.goto('https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ Page loaded');
        console.log('Extracting municipality data...\n');
        
        // Extract data from the page
        const municipalities = await page.evaluate(() => {
            const munis = [];
            
            // Look for the municipality dropdown/select
            const select = document.querySelector('select[id$="_Input3_ctl00_ListBox"]');
            if (select) {
                const options = select.querySelectorAll('option');
                options.forEach(opt => {
                    if (opt.value && opt.value.trim()) {
                        munis.push({
                            name: opt.value.trim(),
                            source: 'ALM Directory'
                        });
                    }
                });
            }
            
            return munis;
        });
        
        console.log(`Found ${municipalities.length} municipalities\n`);
        console.log('First 20:');
        municipalities.slice(0, 20).forEach(m => {
            console.log(`  - ${m.name}`);
        });
        
        if (municipalities.length > 20) {
            console.log(`  ... and ${municipalities.length - 20} more`);
        }
        
        // Save to file
        const data = {
            source: 'Alabama League of Municipalities',
            url: 'https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx',
            scrapedAt: new Date().toISOString(),
            count: municipalities.length,
            municipalities: municipalities
        };
        
        fs.writeFileSync('alm_municipalities.json', JSON.stringify(data, null, 2));
        console.log(`\n✅ Saved ${municipalities.length} municipalities to alm_municipalities.json`);
        
        await browser.close();
        
    } catch (error) {
        console.error('Error:', error.message);
        if (browser) await browser.close();
    }
}

scrapeALMDirectory();
