const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const url = "https://www.google.com/maps/search/Bus+companies+in+texas/@31.4581886,-101.2070028,7z?entry=ttu&g_ep=EgoyMDI2MDUxMi4wIKXMDSoASAFQAw%3D%3D";
    
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1000 });
        console.log("Navigating to URL...");
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 }); // Increased timeout
        await new Promise(r => setTimeout(r, 10000)); // Increased wait time

        console.log("Page loaded. Extracting leads...");
        const leads = await page.evaluate(async () => {
            const results = [];
            const items = document.querySelectorAll('a[href*="/maps/place/"]');
            console.log("Found items:", items.length);
            const seen = new Set();
            
            items.forEach(item => {
                let container = item;
                let steps = 0;
                while (container.parentElement && steps < 10) {
                    const links = Array.from(container.parentElement.querySelectorAll('a[href*="/maps/place/"]'));
                    const uniqueHrefs = new Set(links.map(l => l.href.split('?')[0]));
                    if (uniqueHrefs.size > 1) {
                        break;
                    }
                    container = container.parentElement;
                    steps++;
                }
                
                const companyName = item.getAttribute('aria-label') || item.innerText.split('\n')[0];
                if (!companyName || seen.has(companyName)) return;
                seen.add(companyName);

                const fullText = container.innerText;
                const phoneMatch = fullText.match(/\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
                const phone = phoneMatch ? phoneMatch[0] : null;

                results.push({
                    companyName: companyName.trim().substring(0, 30),
                    phone: phone,
                    uniqueTags: container.parentElement ? new Set(Array.from(container.parentElement.querySelectorAll('a[href*="/maps/place/"]')).map(l => l.href.split('?')[0])).size : 1
                });
            });
            console.log("Results extracted:", results);
            return results;
        });

        console.log("Leads:", JSON.stringify(leads, null, 2));
    } catch (e) {
        console.error("Error occurred:", e);
    } finally {
        if (browser) await browser.close();
        process.exit(0);
    }
})();
