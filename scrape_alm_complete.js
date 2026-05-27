const puppeteer = require('puppeteer');
const fs = require('fs');

async function delayMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeALMCompleteDirectory() {
    console.log('📍 SCRAPING COMPLETE ALM MUNICIPAL DIRECTORY WITH CONTACTS\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('Loading ALM directory...');
        await page.goto('https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ Page loaded');
        console.log('Extracting grid data...\n');
        
        // Get initial grid data
        let allMunicipalities = [];
        let pageNum = 0;
        let hasMorePages = true;
        
        while (hasMorePages && pageNum < 30) {
            pageNum++;
            console.log(`Loading page ${pageNum}...`);
            
            // Extract visible grid data
            const pageData = await page.evaluate(() => {
                const munis = [];
                
                // Find all rows in the grid
                const table = document.querySelector('table[id*="Grid1"]');
                if (!table) {
                    return munis;
                }
                
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > 0) {
                        const text = row.innerText.trim();
                        
                        // Extract municipality data
                        if (text && !text.includes('Municipality') && !text.includes('No Records')) {
                            const lines = text.split('\n');
                            
                            const muniData = {
                                name: lines[0]?.trim() || '',
                                email: '',
                                phone: '',
                                county: lines[1]?.trim() || '',
                                raw: text
                            };
                            
                            // Extract email
                            const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                            if (emailMatch) {
                                muniData.email = emailMatch[0];
                            }
                            
                            // Extract phone
                            const phoneMatch = text.match(/\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/);
                            if (phoneMatch) {
                                muniData.phone = phoneMatch[0];
                            }
                            
                            munis.push(muniData);
                        }
                    }
                });
                
                return munis;
            });
            
            console.log(`  Found ${pageData.length} entries on page ${pageNum}`);
            allMunicipalities = [...allMunicipalities, ...pageData.filter(m => m.name && !allMunicipalities.find(existing => existing.name === m.name))];
            
            // Try to go to next page
            const nextPageBtn = await page.$('[id*="PageNext"], input[type="submit"][value*="Next"], a[class*="next"]');
            
            if (nextPageBtn) {
                try {
                    await nextPageBtn.click();
                    await delayMs(2000);
                    
                    // Check if page actually changed
                    const newPageData = await page.evaluate(() => {
                        const newMusis = [];
                        const table = document.querySelector('table[id*="Grid1"]');
                        if (table) {
                            const rows = table.querySelectorAll('tbody tr');
                            rows.forEach(row => {
                                const text = row.innerText.trim();
                                if (text && !text.includes('Municipality')) {
                                    newMusis.push(text.split('\n')[0]);
                                }
                            });
                        }
                        return newMusis;
                    });
                    
                    if (newPageData.length === 0 || newPageData[0] === pageData[0]?.name) {
                        hasMorePages = false;
                    }
                } catch (err) {
                    hasMorePages = false;
                }
            } else {
                hasMorePages = false;
            }
        }
        
        console.log(`\n✅ Total municipalities extracted: ${allMunicipalities.length}\n`);
        
        // Show sample
        console.log('Sample entries:');
        allMunicipalities.slice(0, 10).forEach(m => {
            console.log(`  • ${m.name}`);
            if (m.email) console.log(`    Email: ${m.email}`);
            if (m.phone) console.log(`    Phone: ${m.phone}`);
        });
        
        // Save data
        const output = {
            source: 'Alabama League of Municipalities',
            url: 'https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx',
            scrapedAt: new Date().toISOString(),
            totalCount: allMunicipalities.length,
            municipalities: allMunicipalities
        };
        
        fs.writeFileSync('alm_complete_directory.json', JSON.stringify(output, null, 2));
        console.log(`\n✅ Saved ${allMunicipalities.length} municipalities to alm_complete_directory.json`);
        
        await browser.close();
        
    } catch (error) {
        console.error('Error:', error.message);
        if (browser) await browser.close();
    }
}

scrapeALMCompleteDirectory();
