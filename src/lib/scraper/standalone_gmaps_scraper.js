const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const url = process.argv[2];
    if (!url) {
        console.log(JSON.stringify([]));
        process.exit(0);
    }
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: 'new', 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        
        // Increase viewport to capture more results
        await page.setViewport({ width: 1280, height: 1000 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait a bit for JS to render the map
        await new Promise(r => setTimeout(r, 3000));

        const leads = await page.evaluate(async () => {
            const results = [];
            
            // Try to scroll the feed if present
            const feed = document.querySelector('div[role="feed"]');
            if (feed) {
                for (let i = 0; i < 4; i++) {
                    feed.scrollBy(0, 1500);
                    await new Promise(r => setTimeout(r, 1200));
                }
            } else {
                // If no role=feed, try scrolling the main scrollable divs
                const scrollables = document.querySelectorAll('div[style*="overflow-y"]');
                if (scrollables.length > 0) {
                    for (let i = 0; i < 4; i++) {
                        scrollables[scrollables.length - 1].scrollBy(0, 1500);
                        await new Promise(r => setTimeout(r, 1200));
                    }
                }
            }
            
            // Find result items: Usually they are link tags to the place
            const items = document.querySelectorAll('a[href*="/maps/place/"]');
            const seen = new Set();
            
            items.forEach(item => {
                // Traverse up to get more context, but stop before entering a container 
                // that holds links to OTHER places to avoid mixing data.
                let container = item;
                let steps = 0;
                while (container.parentElement && steps < 10) {
                    const links = Array.from(container.parentElement.querySelectorAll('a[href*="/maps/place/"]'));
                    const uniqueHrefs = new Set(links.map(l => l.href.split('?')[0]));
                    if (uniqueHrefs.size > 1) {
                        break; // Stop going up! The parent contains other places.
                    }
                    container = container.parentElement;
                    steps++;
                }
                
                const companyName = item.getAttribute('aria-label') || item.innerText;
                if (!companyName || seen.has(companyName)) return;
                seen.add(companyName);

                const fullText = container ? container.innerText : item.innerText;
                
                // Extract phone: Checking for full lines that look like phones first
                let phone = null;
                const lines = fullText.split(/\r?\n/);
                for (const line of lines) {
                    const cleanLine = line.trim();
                    if (/^[\+\(\)\d\s\-]{8,25}$/.test(cleanLine) && cleanLine.replace(/\D/g, '').length >= 8) {
                        phone = cleanLine;
                        break;
                    }
                }
                
                // Fallback loose regex if not found on a separate isolated line
                if (!phone) {
                    const looseRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{1,5}\)?[\s-]?\d{2,4}[\s-]?\d{2,4}[\s-]?\d{2,4}/;
                    const match = fullText.match(looseRegex);
                    if (match && match[0].replace(/\D/g, '').length >= 8) {
                        phone = match[0].trim();
                    }
                }

                // Simple attempt for website
                let website = null;
                const urlMatch = fullText.match(/\b([a-zA-Z0-9-]+\.(com|net|org|io|co|us))\b/i);
                if (urlMatch) {
                    website = 'https://www.' + urlMatch[0];
                }

                // Simple attempt for zip code
                const zipMatch = fullText.match(/\b\d{5}(?:-\d{4})?\b/);
                const zipCode = zipMatch ? zipMatch[0] : null;

                if (phone) {
                    phone = phone.replace(/^\+1[\s-]?/, '').trim();
                }

                results.push({
                    companyName: companyName.trim(),
                    phoneNumber: phone || null,
                    zipCode: zipCode,
                    website: website || null,
                    city: null, // Left to be overridden by user selection
                    state: null // Left to be overridden by user selection
                });
            });
            return results;
        });

        console.log(JSON.stringify(leads));
    } catch (e) {
        console.error(e);
        console.log("[]");
    } finally {
        if (browser) await browser.close();
        process.exit(0);
    }
})();
