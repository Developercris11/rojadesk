const puppeteer = require('puppeteer');
const fs = require('fs');

async function delayMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeAllALMCities() {
    console.log('📍 SCRAPING ALL ALM MUNICIPALITIES - FINAL VERSION\n');
    
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
        
        const allMunicipalities = [];
        const seenNames = new Set();
        let currentPage = 1;
        let totalPages = 1;
        let hasMorePages = true;
        
        while (hasMorePages) {
            console.log(`\n📄 PAGE ${currentPage}:`);
            
            // Extract municipalities from current page
            const pageData = await page.evaluate(() => {
                const munis = [];
                const table = document.querySelector('table[id*="Grid1"]');
                
                if (!table) return munis;
                
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.innerText.trim();
                    
                    // Skip headers and empty rows
                    if (!text || text.includes('Municipality') || text.includes('No Records')) {
                        return;
                    }
                    
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                    if (lines.length === 0) return;
                    
                    const name = lines[0];
                    
                    // Skip invalid entries
                    if (name.match(/^[0-9]+$/) || name.length <= 1 || name.includes('pager')) {
                        return;
                    }
                    
                    const muniData = { name, email: '', phone: '', website: '' };
                    
                    // Extract email
                    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                    if (emailMatch) {
                        muniData.email = emailMatch[1];
                    }
                    
                    // Extract phone
                    const phoneMatch = text.match(/\((\d{3})\)\s*(\d{3})-?(\d{4})/);
                    if (phoneMatch) {
                        muniData.phone = `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}`;
                    }
                    
                    // Extract website
                    const webMatch = text.match(/(https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                    if (webMatch) {
                        muniData.website = webMatch[0];
                    }
                    
                    munis.push(muniData);
                });
                
                return munis;
            });
            
            console.log(`  Found ${pageData.length} municipalities`);
            
            // Add new municipalities
            pageData.forEach(muni => {
                if (!seenNames.has(muni.name)) {
                    seenNames.add(muni.name);
                    allMunicipalities.push(muni);
                }
            });
            
            console.log(`  Running total: ${allMunicipalities.length}`);
            
            // Get paging info and look for next page
            const pageInfo = await page.evaluate(() => {
                const info = { hasNext: false, pageCount: 0 };
                
                // Find all page links
                const pagerRow = document.querySelector('tr.rgPager');
                if (pagerRow) {
                    const pageLinks = pagerRow.querySelectorAll('a[title*="Page"]');
                    const pageNumbers = [];
                    
                    pageLinks.forEach(link => {
                        const match = link.title.match(/\d+/);
                        if (match) {
                            pageNumbers.push(parseInt(match[0]));
                        }
                    });
                    
                    if (pageNumbers.length > 0) {
                        info.pageCount = Math.max(...pageNumbers);
                        info.hasNext = true;
                    }
                    
                    // Also check for "..." link to next pages
                    const nextDots = pagerRow.querySelector('a[title="Next Pages"]');
                    if (nextDots && !nextDots.className.includes('disabled')) {
                        info.hasNext = true;
                    }
                }
                
                return info;
            });
            
            console.log(`  Total pages found: ${pageInfo.pageCount}`);
            
            // Navigate to next page by clicking its link
            if (pageInfo.hasNext && currentPage < Math.min(30, pageInfo.pageCount + 5)) {
                const nextPageClicked = await page.evaluate((nextPageNum) => {
                    const pagerRow = document.querySelector('tr.rgPager');
                    if (!pagerRow) return false;
                    
                    // Try to find and click the next page number
                    const pageLinks = pagerRow.querySelectorAll('a[title^="Go to Page"]');
                    const nextLink = Array.from(pageLinks).find(link => {
                        const match = link.title.match(/(\d+)/);
                        return match && parseInt(match[1]) === nextPageNum;
                    });
                    
                    if (nextLink && !nextLink.className.includes('disabled')) {
                        nextLink.click();
                        return true;
                    }
                    
                    // If next page not found, try "Next Pages" (...) link
                    const nextDotsLink = pagerRow.querySelector('a[title="Next Pages"]');
                    if (nextDotsLink && !nextDotsLink.className.includes('disabled')) {
                        nextDotsLink.click();
                        return true;
                    }
                    
                    return false;
                }, currentPage + 1);
                
                if (nextPageClicked) {
                    await delayMs(3000); // Wait for page to load
                    currentPage++;
                } else {
                    hasMorePages = false;
                }
            } else {
                hasMorePages = false;
            }
        }
        
        console.log(`\n\n✅ SCRAPING COMPLETE!`);
        console.log(`Total municipalities extracted: ${allMunicipalities.length}`);
        console.log(`Expected: 456`);
        console.log(`Coverage: ${(allMunicipalities.length / 456 * 100).toFixed(1)}%\n`);
        
        // Show samples
        if (allMunicipalities.length > 0) {
            console.log('First 10:');
            allMunicipalities.slice(0, 10).forEach((m, i) => {
                console.log(`  ${i+1}. ${m.name}${m.email ? ` (${m.email})` : ''}`);
            });
            
            console.log('\nLast 10:');
            allMunicipalities.slice(-10).forEach((m, i) => {
                const idx = allMunicipalities.length - 10 + i + 1;
                console.log(`  ${idx}. ${m.name}${m.email ? ` (${m.email})` : ''}`);
            });
        }
        
        // Save as JSON
        const output = {
            source: 'Alabama League of Municipalities (ALM)',
            url: 'https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx',
            description: 'Complete list of Alabama municipalities with official city government contacts',
            scrapedAt: new Date().toISOString(),
            totalCount: allMunicipalities.length,
            expectedCount: 456,
            completeness: allMunicipalities.length >= 400 ? '✓ COMPLETE' : allMunicipalities.length >= 200 ? '⚠ Partial' : '✗ Incomplete',
            dataFields: ['name', 'email', 'phone', 'website'],
            municipalities: allMunicipalities.sort((a, b) => a.name.localeCompare(b.name))
        };
        
        fs.writeFileSync('alm_alabama_municipalities.json', JSON.stringify(output, null, 2));
        console.log(`\n✅ Saved: alm_alabama_municipalities.json`);
        
        // Save as CSV for spreadsheet import
        const csvHeaders = 'Municipality Name,Email,Phone,Website';
        const csvRows = allMunicipalities
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(m => `"${m.name.replace(/"/g, '""')}","${m.email}","${m.phone}","${m.website}"`);
        const csv = csvHeaders + '\n' + csvRows.join('\n');
        
        fs.writeFileSync('alm_alabama_municipalities.csv', csv);
        console.log(`✅ Saved: alm_alabama_municipalities.csv`);
        
        await browser.close();
        
    } catch (error) {
        console.error('Fatal error:', error.message);
        console.error(error.stack);
        if (browser) await browser.close();
    }
}

scrapeAllALMCities();
