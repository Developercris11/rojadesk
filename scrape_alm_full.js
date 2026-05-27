const puppeteer = require('puppeteer');
const fs = require('fs');

async function delayMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeALMAll() {
    console.log('📍 SCRAPING ALL ALM MUNICIPALITIES\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1200 });
        
        // Intercept network requests to capture API calls
        const capturedRequests = [];
        await page.on('response', response => {
            if (response.url().includes('grid') || response.url().includes('data') || response.url().includes('GetData')) {
                capturedRequests.push({
                    url: response.url(),
                    status: response.status()
                });
            }
        });
        
        console.log('Loading ALM directory...');
        await page.goto('https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ Page loaded');
        
        // Try to find and click "show all" or expand rows
        console.log('Looking for page size/rows per page options...\n');
        
        const pageInfo = await page.evaluate(() => {
            const info = {
                gridPresent: false,
                pageSize: null,
                totalRecords: null,
                options: []
            };
            
            // Check for RadComboBox or page size selector
            const sizeSelects = document.querySelectorAll('select[id*="PageSize"], select[id*="Rows"], input[id*="PageSize"]');
            if (sizeSelects.length > 0) {
                sizeSelects.forEach(sel => {
                    info.options.push({
                        id: sel.id,
                        type: sel.tagName,
                        value: sel.value || sel.textContent
                    });
                });
            }
            
            // Look for pager info
            const pagerText = document.body.innerText.match(/(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/);
            if (pagerText) {
                info.totalRecords = pagerText[3];
            }
            
            // Check if grid exists
            const grid = document.querySelector('table[id*="Grid"]');
            info.gridPresent = !!grid;
            
            // Look for any visible page size info
            const pagerLabels = document.querySelectorAll('*[class*="pager"], *[class*="page"]');
            pagerLabels.forEach(label => {
                const text = label.innerText.trim();
                if (text.includes('Items per page') || text.includes('Page size') || text.length < 50) {
                    info.options.push(text);
                }
            });
            
            return info;
        });
        
        console.log('Page info:', pageInfo);
        
        // Extract all visible municipalities from grid
        console.log('\nExtracting all visible municipalities from grid...');
        
        const allMunicipalities = [];
        let lastCount = 0;
        let noNewDataCount = 0;
        let pageIteration = 0;
        
        while (noNewDataCount < 3 && pageIteration < 50) {
            pageIteration++;
            
            // Scroll down to load more data if using lazy loading
            await page.evaluate(() => {
                const grid = document.querySelector('table[id*="Grid"]');
                if (grid) {
                    grid.scrollIntoView();
                }
            });
            
            await delayMs(500);
            
            // Extract all data
            const pageData = await page.evaluate(() => {
                const munis = {};
                
                // Find the grid and extract all rows
                const table = document.querySelector('table[id*="Grid1"]');
                if (!table) {
                    return Object.values(munis);
                }
                
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    const text = row.innerText.trim();
                    
                    // Skip headers and empty rows
                    if (!text || text.includes('Municipality') || text.includes('No Records') || text === '1') {
                        return;
                    }
                    
                    // Parse the row - format is typically: Name | Address | Phone | Website | Email
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                    
                    if (lines.length > 0) {
                        const name = lines[0];
                        
                        // Skip if already have this one
                        if (munis[name]) return;
                        
                        const muniData = {
                            name: name,
                            email: '',
                            phone: '',
                            website: '',
                            address: lines.slice(1).join(' ')
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
                        
                        // Extract website
                        const wwwMatch = text.match(/(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                        if (wwwMatch) {
                            muniData.website = wwwMatch[0];
                        }
                        
                        munis[name] = muniData;
                    }
                });
                
                return Object.values(munis);
            });
            
            console.log(`  Iteration ${pageIteration}: Found ${pageData.length} total municipalities so far`);
            
            // Update with new data
            pageData.forEach(newMuni => {
                if (!allMunicipalities.find(m => m.name === newMuni.name)) {
                    allMunicipalities.push(newMuni);
                }
            });
            
            if (pageData.length === lastCount) {
                noNewDataCount++;
            } else {
                noNewDataCount = 0;
            }
            
            lastCount = pageData.length;
            
            // Try to click next page
            const nextBtn = await page.$('a[title="Next"], input[value="Next"]');
            if (nextBtn) {
                try {
                    await nextBtn.click();
                    await delayMs(1500);
                } catch (e) {
                    break;
                }
            } else {
                break;
            }
        }
        
        console.log(`\n✅ Total municipalities extracted: ${allMunicipalities.length}`);
        
        if (allMunicipalities.length > 0) {
            console.log('\nSample entries:');
            allMunicipalities.slice(0, 10).forEach(m => {
                console.log(`  • ${m.name}`);
                if (m.email) console.log(`    Email: ${m.email}`);
                if (m.phone) console.log(`    Phone: ${m.phone}`);
            });
        }
        
        // Save data
        const output = {
            source: 'Alabama League of Municipalities',
            url: 'https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx',
            scrapedAt: new Date().toISOString(),
            totalCount: allMunicipalities.length,
            expectedTotal: 456,
            municipalities: allMunicipalities.sort((a, b) => a.name.localeCompare(b.name))
        };
        
        fs.writeFileSync('alm_municipalities_with_contacts.json', JSON.stringify(output, null, 2));
        console.log(`\n✅ Saved to alm_municipalities_with_contacts.json`);
        
        await browser.close();
        
    } catch (error) {
        console.error('Error:', error.message);
        if (browser) await browser.close();
    }
}

scrapeALMAll();
