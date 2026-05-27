const puppeteer = require('puppeteer');
const fs = require('fs');

async function delayMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeALMAllRows() {
    console.log('📍 SCRAPING ALL ALM MUNICIPALITIES (FULL PAGE SIZE)\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 2000 });
        
        console.log('Loading ALM directory...');
        await page.goto('https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ Page loaded');
        console.log('Setting page size to show all rows...\n');
        
        // Try to change the page size
        const pageSizeChanged = await page.evaluate(() => {
            // Find the PageSizeComboBox and change its value
            const input = document.querySelector('input[id$="PageSizeComboBox_Input"]');
            const combo = document.querySelector('input[id$="PageSizeComboBox_ClientState"]');
            
            if (input) {
                // Try to set a large number
                input.value = '500';
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('keydown', { bubbles: true }));
                input.dispatchEvent(new Event('keyup', { bubbles: true }));
                return true;
            }
            return false;
        });
        
        if (pageSizeChanged) {
            console.log('✓ Changed page size setting');
            await delayMs(2000);
        }
        
        // Alternative: Try to find a "show all" option or change page size via Telerik API
        await page.evaluate(() => {
            // Try Telerik grid methods if available
            const gridFunction = window.Lister2_GetGrid;
            if (gridFunction) {
                try {
                    const grid = gridFunction();
                    if (grid && grid.set_pageSize) {
                        grid.set_pageSize(500);
                    }
                } catch (e) {
                    console.log('Could not access grid API');
                }
            }
        });
        
        await delayMs(3000);
        
        // Extract all data visible on page
        console.log('Extracting all visible municipalities...\n');
        
        const allMunicipalities = await page.evaluate(() => {
            const munis = [];
            const seenNames = new Set();
            
            // Get all rows from the grid
            const table = document.querySelector('table[id*="Grid1"]');
            if (!table) {
                return munis;
            }
            
            const rows = table.querySelectorAll('tbody tr');
            console.log(`Found ${rows.length} rows in grid`);
            
            rows.forEach(row => {
                const text = row.innerText.trim();
                
                // Skip headers, empty rows, and "No Records"
                if (!text || text.includes('Municipality') || text.includes('No Records') || text.match(/^[0-9]$/)) {
                    return;
                }
                
                const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                
                if (lines.length > 0) {
                    const name = lines[0];
                    
                    // Skip duplicates and row numbers
                    if (seenNames.has(name) || name.match(/^[0-9]+$/) || name.length === 1) {
                        return;
                    }
                    seenNames.add(name);
                    
                    const muniData = {
                        name: name,
                        email: '',
                        phone: '',
                        website: '',
                        county: '',
                        address: lines.slice(1).join(' ')
                    };
                    
                    // Extract email
                    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                    if (emailMatch) {
                        muniData.email = emailMatch[1];
                    }
                    
                    // Extract phone
                    const phoneMatch = text.match(/\(([0-9]{3})\)\s*([0-9]{3})-?([0-9]{4})/);
                    if (phoneMatch) {
                        muniData.phone = `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}`;
                    }
                    
                    // Extract website (http/www)
                    const webMatch = text.match(/(https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                    if (webMatch) {
                        muniData.website = webMatch[0];
                    }
                    
                    munis.push(muniData);
                }
            });
            
            return munis;
        });
        
        console.log(`\n✅ Extracted ${allMunicipalities.length} municipalities`);
        
        if (allMunicipalities.length > 0) {
            console.log('\nFirst 15 entries:');
            allMunicipalities.slice(0, 15).forEach((m, idx) => {
                console.log(`\n  ${idx + 1}. ${m.name}`);
                if (m.email) console.log(`     Email: ${m.email}`);
                if (m.phone) console.log(`     Phone: ${m.phone}`);
                if (m.website) console.log(`     Website: ${m.website}`);
            });
        }
        
        // Save data
        const output = {
            source: 'Alabama League of Municipalities',
            url: 'https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx',
            scrapedAt: new Date().toISOString(),
            totalCount: allMunicipalities.length,
            expectedTotal: 456,
            dataQuality: allMunicipalities.length > 400 ? 'Complete' : 'Partial',
            municipalities: allMunicipalities.sort((a, b) => a.name.localeCompare(b.name))
        };
        
        fs.writeFileSync('alm_all_municipalities.json', JSON.stringify(output, null, 2));
        console.log(`\n✅ Saved ${allMunicipalities.length} municipalities to alm_all_municipalities.json`);
        
        await browser.close();
        
    } catch (error) {
        console.error('Error:', error.message);
        if (browser) await browser.close();
    }
}

scrapeALMAllRows();
