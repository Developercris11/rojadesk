const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeALMWithDetails() {
    console.log('📍 SCRAPING ALM DIRECTORY WITH CONTACT DETAILS\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        const page = await browser.newPage();
        
        // Set larger viewport and timeout
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('Loading ALM directory...');
        await page.goto('https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ Page loaded\n');
        
        // Get all municipalities first
        const municipalities = await page.evaluate(() => {
            const munis = [];
            const select = document.querySelector('select[id$="_Input3_ctl00_ListBox"]');
            if (select) {
                const options = select.querySelectorAll('option');
                options.forEach(opt => {
                    if (opt.value && opt.value.trim()) {
                        munis.push(opt.value.trim());
                    }
                });
            }
            return munis;
        });
        
        console.log(`Found ${municipalities.length} municipalities`);
        console.log('Extracting contact details...\n');
        
        const results = [];
        const batchSize = 5; // Process in batches to avoid timeout
        
        for (let i = 0; i < Math.min(10, municipalities.length); i++) {
            const muniName = municipalities[i];
            
            try {
                console.log(`[${i + 1}/10] Fetching: ${muniName}`);
                
                // Clear previous selections
                await page.evaluate(() => {
                    const select = document.querySelector('select[id$="_Input3_ctl00_ListBox"]');
                    if (select) {
                        Array.from(select.options).forEach(opt => opt.selected = false);
                    }
                });
                
                // Select the municipality
                await page.evaluate((name) => {
                    const select = document.querySelector('select[id$="_Input3_ctl00_ListBox"]');
                    if (select) {
                        const opt = Array.from(select.options).find(o => o.value === name);
                        if (opt) opt.selected = true;
                    }
                }, muniName);
                
                // Find and click submit button
                const submitBtn = await page.$('input[id$="SubmitButton"], button[id$="SubmitButton"], input[type="submit"]');
                if (submitBtn) {
                    await submitBtn.click();
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
                    await page.waitForTimeout(1000);
                }
                
                // Extract visible data from the page
                const data = await page.evaluate(() => {
                    const result = {
                        mayor: null,
                        email: null,
                        phone: null,
                        address: null,
                        details: []
                    };
                    
                    // Look for visible text on the page
                    const bodyText = document.body.innerText;
                    const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l);
                    
                    // Search for common patterns
                    lines.forEach((line, idx) => {
                        if (line.toLowerCase().includes('mayor')) {
                            result.mayor = line;
                        }
                        if (line.includes('@')) {
                            result.email = line;
                        }
                        if (line.match(/\(\d{3}\)/)) {
                            result.phone = line;
                        }
                        result.details.push(line);
                    });
                    
                    return result;
                });
                
                results.push({
                    name: muniName,
                    ...data
                });
                
                console.log(`  ✓ Extracted data`);
                
            } catch (err) {
                console.log(`  ✗ Error: ${err.message}`);
                results.push({ name: muniName, error: err.message });
            }
        }
        
        // Save results
        const output = {
            source: 'Alabama League of Municipalities',
            scrapedAt: new Date().toISOString(),
            sample: true,
            sampleSize: results.length,
            totalMunicipalities: municipalities.length,
            municipalities: results
        };
        
        fs.writeFileSync('alm_municipalities_details_sample.json', JSON.stringify(output, null, 2));
        console.log(`\n✅ Saved sample to alm_municipalities_details_sample.json`);
        
        await browser.close();
        
    } catch (error) {
        console.error('Fatal error:', error.message);
        if (browser) await browser.close();
    }
}

scrapeALMWithDetails();
