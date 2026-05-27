const puppeteer = require('puppeteer');
const fs = require('fs');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeALMGridData() {
    console.log('📍 EXTRACTING ALM MUNICIPAL GRID DATA\n');
    
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
        
        console.log('✅ Page loaded\n');
        
        // Extract municipalities and look for any Telerik grid data
        const pageData = await page.evaluate(() => {
            const munis = [];
            const gridData = [];
            
            // Get municipalities from dropdown
            const select = document.querySelector('select[id$="_Input3_ctl00_ListBox"]');
            if (select) {
                const options = select.querySelectorAll('option');
                options.forEach(opt => {
                    if (opt.value && opt.value.trim()) {
                        munis.push(opt.value.trim());
                    }
                });
            }
            
            // Look for Telerik grid tables
            const tables = document.querySelectorAll('table[id*="Grid"], table[class*="rgMasterTable"], div[class*="rgContent"] table');
            tables.forEach((table, idx) => {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    const rowData = [];
                    cells.forEach(cell => {
                        rowData.push(cell.innerText.trim());
                    });
                    if (rowData.some(d => d)) {
                        gridData.push({
                            tableIndex: idx,
                            data: rowData
                        });
                    }
                });
            });
            
            // Look for any text that looks like contact info
            const bodyText = document.body.innerText;
            const emailMatches = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            const phoneMatches = bodyText.match(/\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g);
            
            return {
                totalMunicipalities: munis.length,
                municipalities: munis.slice(0, 20),
                gridTableCount: tables.length,
                gridDataRows: gridData.length,
                emailsFound: emailMatches ? [...new Set(emailMatches)] : [],
                phonesFound: phoneMatches ? [...new Set(phoneMatches)] : []
            };
        });
        
        console.log('=== DATA STRUCTURE ===');
        console.log(`Total municipalities: ${pageData.totalMunicipalities}`);
        console.log(`Grid tables found: ${pageData.gridTableCount}`);
        console.log(`Grid data rows: ${pageData.gridDataRows}`);
        console.log(`\nSample municipalities:`);
        pageData.municipalities.forEach(m => console.log(`  - ${m}`));
        
        if (pageData.emailsFound.length > 0) {
            console.log(`\n✓ Found ${pageData.emailsFound.length} unique email(s) on page`);
            pageData.emailsFound.slice(0, 5).forEach(e => console.log(`  - ${e}`));
        }
        
        if (pageData.phonesFound.length > 0) {
            console.log(`\n✓ Found ${pageData.phonesFound.length} unique phone(s) on page`);
            pageData.phonesFound.slice(0, 5).forEach(p => console.log(`  - ${p}`));
        }
        
        // Try to access the data through page's window object
        console.log('\n\nSearching for grid data in JavaScript window object...');
        const windowData = await page.evaluate(() => {
            const data = {};
            
            // Common Telerik grid property names
            if (window._pages) data.pages = typeof window._pages;
            if (window.RadGrid1) data.RadGrid1 = 'exists';
            if (window.GridData) data.GridData = 'exists';
            
            // Look for any global objects with 'grid' in name
            for (const key in window) {
                if (key.toLowerCase().includes('grid')) {
                    data[key] = typeof window[key];
                }
            }
            
            return data;
        });
        
        console.log('Window objects with "grid":', Object.keys(windowData).length > 0 ? windowData : 'None found');
        
        // Save summary
        const output = {
            source: 'Alabama League of Municipalities',
            url: 'https://alm.imiscloud.com/ALALM/ALALM/About/ALM-Municipal-Directory.aspx',
            scrapedAt: new Date().toISOString(),
            summary: pageData,
            notes: [
                'Total municipalities found: 456',
                'Grid data loading appears to be via JavaScript/AJAX',
                'Alternative: Try searching for each city individually via form submission',
                'Recommendation: Use ALM municipalities list as authoritative source'
            ]
        };
        
        fs.writeFileSync('alm_data_analysis.json', JSON.stringify(output, null, 2));
        console.log('\n✅ Saved analysis to alm_data_analysis.json');
        
        await browser.close();
        
    } catch (error) {
        console.error('Error:', error.message);
        if (browser) await browser.close();
    }
}

scrapeALMGridData();
