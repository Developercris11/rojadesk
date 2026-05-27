const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    try {
        const browser = await puppeteer.launch({ 
            headless: 'new', // or false if headful is needed
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        
        console.log("Navigating...");
        await page.goto("https://www.bbb.org/search?find_country=USA&find_entity=10035-000&find_latlng=32.755894%2C-111.670958&find_loc=Arizona%20City%2C%20AZ&find_text=General%20Contractor&find_type=Category&page=1&sort=AToZ&touched=1", { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.error(e));
        
        console.log("Waiting 30 seconds for Cloudflare...");
        await new Promise(r => setTimeout(r, 30000));
        const title = await page.title();
        console.log("Title:", title);
        
        const html = await page.content();
        console.log("HTML length:", html.length);
        if (html.includes("Just a moment") || html.includes("cloudflare")) {
            console.log("Cloudflare block detected. Snippet:", html.substring(0, 1000));
        } else {
            console.log("Bypass successful!");
            const links = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('bbb.org')).slice(0, 10);
            });
            console.log("Top links found:", links);
        }
        
        await page.screenshot({ path: './bbb_mobile_test.png' });
        await browser.close();
    } catch(err) {
        console.error(err);
    }
})();
