const puppeteer = require('puppeteer');
const fs = require('fs');

async function delayMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeAllPages() {
    console.log('📍 SCRAPING ALL ALM PAGES VIA NUMBERED PAGINATION\n');
    
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
        
        // Get all available page numbers
        const pageNumbers = await page.evaluate(() => {
            const pages = [];
            // Find all pager links that are numbered
            const pagerLinks = document.querySelectorAll('[id*="PageMode"] a, [id*="Pager"] a');
            
            pagerLinks.forEach(link => {
                const text = link.innerText.trim();
                const num = parseInt(text);
                if (!isNaN(num) && num > 0) {
                    pages.push({ num, link: link });
                }
            });
            
            // If that doesn't work, find all links in pager area
            if (pages.length === 0) {
                const pagerTable = document.querySelector('[id*="PageMode"] table, [class*="pager"] table');
                if (pagerTable) {
                    const links = pagerTable.querySelectorAll('a');
                    links.forEach(link => {
                        const text = link.innerText.trim();
                        const num = parseInt(text);
                        if (!isNaN(num) && num > 0 && !pages.find(p => p.num === num)) {
                            pages.push(num);
                        }
                    });
                }
            }
            
            return pages.length > 0 ? pages : 'No pages found';
        });
        
        console.log(`Found page numbers: ${Array.isArray(pageNumbers) ? pageNumbers.map(p => typeof p === 'object' ? p.num : p).join(', ') : pageNumbers}\n`);
        
        const allMunicipalities = [];
        const seenNames = new Set();
        
        // If we got page numbers, click through them
        if (Array.isArray(pageNumbers)) {
            for (let i = 0; i < Math.min(pageNumbers.length, 25); i++) {
                const pageNum = typeof pageNumbers[i] === 'object' ? pageNumbers[i].num : pageNumbers[i];
                
                console.log(`Clicking page ${pageNum}...`);
                
                // Click on the page number
                await page.evaluate((num) => {
                    const pagerTable = document.querySelector('table[id*="PageMode"], [id*="Pager"] table, [class*="grid"] [class*="pager"] table');
                    if (pagerTable) {
                        const links = pagerTable.querySelectorAll('a');
                        const pageLink = Array.from(links).find(l => parseInt(l.innerText.trim()) === num);
                        if (pageLink) {
                            pageLink.click();
                        }
                    }
                }, pageNum);
                
                await delayMs(2500);
                
                // Extract data
                const pageData = await page.evaluate(() => {
                    const munis = [];
                    const table = document.querySelector('table[id*="Grid1"]');
                    
                    if (!table) return munis;
                    
                    const rows = table.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const text = row.innerText.trim();
                        if (!text || text.includes('Municipality') || text.includes('No Records')) return;
                        
                        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                        if (lines.length === 0) return;
                        
                        const name = lines[0];
                        if (name.match(/^[0-9]+$/) || name.length <= 1) return;
                        
                        const muniData = { name, email: '', phone: '', website: '' };
                        
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
                
                console.log(`  Found ${pageData.length} entries`);
                
                pageData.forEach(muni => {
                    if (!seenNames.has(muni.name)) {
                        seenNames.add(muni.name);
                        allMunicipalities.push(muni);
                    }
                });
                
                console.log(`  Total: ${allMunicipalities.length}\n`);
            }
        } else {
            console.log('Could not find page numbers, attempting sequential navigation...\n');
            
            // Fallback: try clicking numbered links directly
            let pageNum = 1;
            let foundPages = new Set();
            foundPages.add(1);
            
            while (pageNum <= 30) {
                console.log(`Page ${pageNum}: Extracting...`);
                
                const pageData = await page.evaluate(() => {
                    const munis = [];
                    const table = document.querySelector('table[id*="Grid1"]');
                    if (!table) return munis;
                    
                    const rows = table.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const text = row.innerText.trim();
                        if (!text || text.includes('Municipality') || text.includes('No Records')) return;
                        
                        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                        if (lines.length === 0) return;
                        
                        const name = lines[0];
                        if (name.match(/^[0-9]+$/) || name.length <= 1) return;
                        
                        const muniData = { name, email: '', phone: '', website: '' };
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
                
                console.log(`  Found ${pageData.length}`);
                pageData.forEach(m => {
                    if (!seenNames.has(m.name)) {
                        seenNames.add(m.name);
                        allMunicipalities.push(m);
                    }
                });
                
                console.log(`  Total: ${allMunicipalities.length}\n`);
                
                // Try to click next numbered page
                const clicked = await page.evaluate((nextPage) => {
                    const pagerArea = document.querySelector('[id*="PageMode"] table, [id*="Pager"] table, [class*="pager"] table');
                    if (!pagerArea) return false;
                    
                    const allLinks = pagerArea.querySelectorAll('a');
                    const nextLink = Array.from(allLinks).find(l => {
                        const text = parseInt(l.innerText.trim());
                        return text === nextPage;
                    });
                    
                    if (nextLink && !nextLink.className.includes('disabled')) {
                        nextLink.click();
                        return true;
                    }
                    return false;
                }, pageNum + 1);
                
                if (!clicked) {
                    console.log('No more pages, stopping.');
                    break;
                }
                
                await delayMs(2500);
                pageNum++;
            }
        }
        
        console.log(`\n\n✅ FINAL RESULT: ${allMunicipalities.length} municipalities\n`);
        
        // Save
        const output = {
            source: 'Alabama League of Municipalities (ALM)',
            url: 'https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx',
            scrapedAt: new Date().toISOString(),
            totalCount: allMunicipalities.length,
            expectedCount: 456,
            dataQuality: allMunicipalities.length >= 400 ? '✓ COMPLETE' : allMunicipalities.length >= 200 ? 'Partial (~50%)' : 'Incomplete',
            municipalities: allMunicipalities.sort((a, b) => a.name.localeCompare(b.name))
        };
        
        fs.writeFileSync('alm_complete.json', JSON.stringify(output, null, 2));
        
        const csv = 'Name,Email,Phone,Website\n' + 
                    allMunicipalities.map(m => 
                        `"${m.name.replace(/"/g, '""')}","${m.email}","${m.phone}","${m.website}"`
                    ).join('\n');
        fs.writeFileSync('alm_complete.csv', csv);
        
        console.log(`✅ Saved: alm_complete.json and alm_complete.csv`);
        
        await browser.close();
        
    } catch (error) {
        console.error('Error:', error.message);
        if (browser) await browser.close();
    }
}

scrapeAllPages();
