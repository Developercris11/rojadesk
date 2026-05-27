const puppeteer = require('puppeteer');
const fs = require('fs');

async function delayMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeALMPaginated() {
    console.log('📍 SCRAPING ALL ALM MUNICIPALITIES (PAGINATED)\n');
    
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
        let pageNum = 1;
        let hasNextPage = true;
        
        while (hasNextPage) {
            console.log(`📄 PAGE ${pageNum}`);
            
            // Extract data from current page
            const pageData = await page.evaluate(() => {
                const munis = [];
                const table = document.querySelector('table[id*="Grid1"]');
                
                if (!table) {
                    return munis;
                }
                
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    const text = row.innerText.trim();
                    
                    // Skip invalid rows
                    if (!text || text.includes('Municipality') || text.includes('No Records')) {
                        return;
                    }
                    
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                    if (lines.length === 0) {
                        return;
                    }
                    
                    const name = lines[0];
                    
                    // Filter out row numbers and single characters
                    if (name.match(/^[0-9]+$/) || name.length === 1) {
                        return;
                    }
                    
                    const muniData = {
                        name: name,
                        email: '',
                        phone: '',
                        website: '',
                        address: lines.slice(1).join(' ')
                    };
                    
                    // Extract email (capturing only valid ones)
                    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                    if (emailMatch && !emailMatch[1].includes('no email')) {
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
            
            console.log(`   Found ${pageData.length} municipalities on this page`);
            
            // Add new municipalities
            pageData.forEach(muni => {
                if (!seenNames.has(muni.name)) {
                    seenNames.add(muni.name);
                    allMunicipalities.push(muni);
                }
            });
            
            console.log(`   Total so far: ${allMunicipalities.length}`);
            
            // Look for next page button
            const pagerInfo = await page.evaluate(() => {
                // Look for paging controls
                const nextBtn = document.querySelector('a[title="Next Page"], a[class*="next"], input[value="Next"]');
                const lastBtn = document.querySelector('a[title*="Last"]');
                const pagerText = document.body.innerText.match(/Page \d+ of (\d+)/);
                
                return {
                    hasNextBtn: !!nextBtn,
                    hasLastBtn: !!lastBtn,
                    pageInfo: pagerText?.[0] || 'unknown',
                    totalPages: pagerText?.[1] || 'unknown'
                };
            });
            
            console.log(`   Pager: ${pagerInfo.pageInfo}`);
            
            // Try to click next page
            const nextPageBtn = await page.$('a[title="Next Page"], a[class*="next-page"]');
            
            if (nextPageBtn) {
                try {
                    await nextPageBtn.click();
                    await delayMs(2500); // Wait for data to load
                    pageNum++;
                } catch (error) {
                    console.log(`   ✗ Error clicking next: ${error.message}`);
                    hasNextPage = false;
                }
            } else {
                // Check if we can use keyboard navigation
                const canNavigate = await page.evaluate(() => {
                    // Look for any disabled next button indicators
                    const nextBtn = document.querySelector('a[title="Next Page"]');
                    if (!nextBtn) return false;
                    
                    const isDisabled = nextBtn.className.includes('disabled') || 
                                     nextBtn.getAttribute('aria-disabled') === 'true';
                    return !isDisabled;
                });
                
                if (canNavigate) {
                    // Try again
                    const btn = await page.$('a[title="Next Page"]');
                    if (btn) {
                        await btn.click();
                        await delayMs(2500);
                        pageNum++;
                    } else {
                        hasNextPage = false;
                    }
                } else {
                    hasNextPage = false;
                }
            }
            
            // Safety limit
            if (pageNum > 25) {
                console.log('   ⚠ Reached page limit (25 pages), stopping');
                hasNextPage = false;
            }
        }
        
        console.log(`\n✅ COMPLETE: Extracted ${allMunicipalities.length} municipalities\n`);
        
        if (allMunicipalities.length > 0) {
            console.log('First 10 entries:');
            allMunicipalities.slice(0, 10).forEach((m, idx) => {
                console.log(`\n  ${idx + 1}. ${m.name}`);
                if (m.email) console.log(`     ✉ ${m.email}`);
                if (m.phone) console.log(`     ☎ ${m.phone}`);
                if (m.website) console.log(`     🌐 ${m.website}`);
            });
            
            console.log('\n\nLast 10 entries:');
            allMunicipalities.slice(-10).forEach((m, idx) => {
                const actualIdx = allMunicipalities.length - 10 + idx + 1;
                console.log(`\n  ${actualIdx}. ${m.name}`);
                if (m.email) console.log(`     ✉ ${m.email}`);
                if (m.phone) console.log(`     ☎ ${m.phone}`);
            });
        }
        
        // Save data
        const output = {
            source: 'Alabama League of Municipalities (ALM)',
            url: 'https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx',
            scrapedAt: new Date().toISOString(),
            totalCount: allMunicipalities.length,
            expectedCount: 456,
            dataType: 'City/Municipal Government Contacts',
            dataQuality: allMunicipalities.length >= 400 ? 'Complete' : allMunicipalities.length >= 200 ? 'Partial' : 'Incomplete',
            municipalities: allMunicipalities.sort((a, b) => a.name.localeCompare(b.name))
        };
        
        fs.writeFileSync('alm_all_cities_complete.json', JSON.stringify(output, null, 2));
        console.log(`\n\n✅ SAVED: alm_all_cities_complete.json (${allMunicipalities.length} municipalities)`);
        
        // Also save a summary CSV for quick reference
        const csv = 'Name,Email,Phone,Website,Address\n' + 
                    allMunicipalities.map(m => 
                        `"${m.name.replace(/"/g, '""')}","${m.email}","${m.phone}","${m.website}","${m.address.replace(/"/g, '""')}"`
                    ).join('\n');
        
        fs.writeFileSync('alm_all_cities_complete.csv', csv);
        console.log('✅ SAVED: alm_all_cities_complete.csv');
        
        await browser.close();
        
    } catch (error) {
        console.error('Fatal error:', error.message);
        if (browser) await browser.close();
    }
}

scrapeALMPaginated();
