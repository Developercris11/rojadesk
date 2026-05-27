const puppeteer = require('puppeteer');
const fs = require('fs');

async function delayMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeALMBetterPagination() {
    console.log('📍 ANALYZING PAGINATION AND SCRAPING ALM\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1500 });
        
        console.log('Loading ALM directory...');
        await page.goto('https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ Page loaded\n');
        
        // First, analyze the pagination structure
        const paginationInfo = await page.evaluate(() => {
            const info = {
                pagerElements: [],
                buttonSelectors: [],
                nextPageSelectors: [],
                allButtons: []
            };
            
            // Find all elements that might contain pagination
            const pagerContainers = document.querySelectorAll('[id*="pager"], [class*="pager"], [id*="Pager"], [class*="Pager"]');
            pagerContainers.forEach(el => {
                info.pagerElements.push({
                    tag: el.tagName,
                    id: el.id,
                    class: el.className,
                    text: el.innerText?.substring(0, 100)
                });
            });
            
            // Find all buttons/links
            const buttons = document.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
            buttons.forEach(btn => {
                const text = btn.value || btn.innerText || btn.textContent || '';
                const title = btn.title || btn.getAttribute('aria-label') || '';
                const id = btn.id;
                
                if (text.toLowerCase().includes('next') || title.toLowerCase().includes('next') || 
                    id.toLowerCase().includes('next') || text === '>') {
                    info.nextPageSelectors.push({
                        tag: btn.tagName,
                        text: text.trim(),
                        title: title,
                        id: id,
                        class: btn.className,
                        enabled: !btn.disabled && !btn.className.includes('disabled')
                    });
                }
                
                // Log all navigation-like buttons
                if (text.match(/^[<>|]/) || text.match(/\d+/) || 
                    ['previous', 'next', 'first', 'last', 'page'].some(word => text.toLowerCase().includes(word))) {
                    info.allButtons.push({
                        tag: btn.tagName,
                        text: text.trim().substring(0, 20),
                        id: id.substring(0, 50)
                    });
                }
            });
            
            return info;
        });
        
        console.log('=== PAGINATION ANALYSIS ===\n');
        console.log('Pager Elements Found:', paginationInfo.pagerElements.length);
        if (paginationInfo.pagerElements.length > 0) {
            paginationInfo.pagerElements.slice(0, 3).forEach(el => {
                console.log(`  - ${el.tag}#${el.id} - "${el.text?.substring(0, 50)}"`);
            });
        }
        
        console.log('\nNext Page Buttons Found:', paginationInfo.nextPageSelectors.length);
        paginationInfo.nextPageSelectors.forEach(btn => {
            console.log(`  - ${btn.tag} "${btn.text}" [${btn.enabled ? 'ENABLED' : 'DISABLED'}]`);
        });
        
        console.log('\nAll Navigation Elements:', paginationInfo.allButtons.length);
        paginationInfo.allButtons.slice(0, 10).forEach(btn => {
            console.log(`  - ${btn.tag} "${btn.text}"`);
        });
        
        // Now try to scrape with the information we found
        console.log('\n\n=== STARTING FULL SCRAPE ===\n');
        
        const allMunicipalities = [];
        const seenNames = new Set();
        let pageNum = 1;
        let successfulPages = 0;
        
        while (pageNum <= 30) {
            console.log(`Page ${pageNum}: Extracting data...`);
            
            // Extract municipalities
            const pageData = await page.evaluate(() => {
                const munis = [];
                const table = document.querySelector('table[id*="Grid1"]');
                
                if (!table) {
                    return munis;
                }
                
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.innerText.trim();
                    if (!text || text.includes('Municipality') || text.includes('No Records')) return;
                    
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                    if (lines.length === 0) return;
                    
                    const name = lines[0];
                    if (name.match(/^[0-9]+$/) || name.length <= 1) return;
                    
                    const muniData = { name, email: '', phone: '', website: '', address: lines.slice(1).join(' ') };
                    
                    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                    if (emailMatch) muniData.email = emailMatch[1];
                    
                    const phoneMatch = text.match(/\((\d{3})\)\s*(\d{3})-?(\d{4})/);
                    if (phoneMatch) muniData.phone = `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}`;
                    
                    const webMatch = text.match(/(https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                    if (webMatch) muniData.website = webMatch[0];
                    
                    munis.push(muniData);
                });
                
                return munis;
            });
            
            console.log(`  Found ${pageData.length} on page`);
            
            // Add new ones
            pageData.forEach(muni => {
                if (!seenNames.has(muni.name)) {
                    seenNames.add(muni.name);
                    allMunicipalities.push(muni);
                }
            });
            
            console.log(`  Total: ${allMunicipalities.length}\n`);
            
            if (pageData.length === 0) {
                console.log('No data on this page, stopping.');
                break;
            }
            
            // Try to find and click next button - try multiple selectors
            let nextButtonClicked = false;
            const nextSelectors = [
                'a[title*="Next"]',
                'a[class*="rgPageNext"]',
                'input[value="Next"]',
                'button:contains("Next")',
                'a:contains(">")',
                '[class*="next"]'
            ];
            
            for (const selector of nextSelectors) {
                try {
                    const btn = await page.$(selector);
                    if (btn) {
                        const isDisabled = await page.evaluate((sel) => {
                            const el = document.querySelector(sel);
                            if (!el) return true;
                            return el.classList.contains('disabled') || el.disabled;
                        }, selector);
                        
                        if (!isDisabled) {
                            await btn.click();
                            await delayMs(2500);
                            nextButtonClicked = true;
                            successfulPages++;
                            break;
                        }
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
            
            if (!nextButtonClicked) {
                console.log('Could not find next button, pagination likely complete.');
                break;
            }
            
            pageNum++;
        }
        
        console.log(`\n\n✅ COMPLETE: Extracted ${allMunicipalities.length} municipalities from ${pageNum} pages\n`);
        
        // Save
        const output = {
            source: 'Alabama League of Municipalities (ALM)',
            url: 'https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx',
            scrapedAt: new Date().toISOString(),
            totalCount: allMunicipalities.length,
            expectedCount: 456,
            dataQuality: allMunicipalities.length >= 400 ? 'Complete ✓' : allMunicipalities.length >= 200 ? 'Partial' : 'Incomplete',
            municipalities: allMunicipalities.sort((a, b) => a.name.localeCompare(b.name))
        };
        
        fs.writeFileSync('alm_municipalities_final.json', JSON.stringify(output, null, 2));
        
        const csv = 'Name,Email,Phone,Website\n' + 
                    allMunicipalities.map(m => 
                        `"${m.name.replace(/"/g, '""')}","${m.email}","${m.phone}","${m.website}"`
                    ).join('\n');
        fs.writeFileSync('alm_municipalities_final.csv', csv);
        
        console.log(`✅ Files saved:`);
        console.log(`   - alm_municipalities_final.json (${allMunicipalities.length} records)`);
        console.log(`   - alm_municipalities_final.csv (${allMunicipalities.length} records)`);
        
        await browser.close();
        
    } catch (error) {
        console.error('Error:', error.message);
        if (browser) await browser.close();
    }
}

scrapeALMBetterPagination();
