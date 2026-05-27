const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');

puppeteer.use(StealthPlugin());

async function scrape(url) {
    let browser;
    try {
        // Rewrite to mobile site to bypass Cloudflare
        let targetUrl = url;
        if (url.includes('www.yellowpages.com')) {
            targetUrl = url.replace('www.yellowpages.com', 'm.yellowpages.com');
            console.error(`Rewriting to mobile site: ${targetUrl}`);
        }

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        console.error('Priming with Google...');
        await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });

        await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));

        console.error(`Navigating to target: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 90000 });

        let title = await page.title();
        console.error(`Page Title: ${title}`);

        if (title.includes('Attention Required') || title.includes('Cloudflare')) {
            console.error('Cloudflare detected, waiting 15s for automatic pass...');
            await new Promise(r => setTimeout(r, 15000));
            // Check again
            title = await page.title();
            if (title.includes('Attention Required') || title.includes('Cloudflare')) {
                throw new Error('Blocked by Cloudflare even on mobile after wait');
            }
        }

        if (url.includes('controller.com')) {
            console.error('Waiting for dealer tiles...');
            await page.waitForSelector('a.dealer-title-text', { timeout: 30000 })
                .catch(e => console.error(`Timeout waiting for tiles: ${e.message}`));
            
            const count = await page.evaluate(() => {
                return document.querySelectorAll('a.dealer-title-text').length;
            });
            console.error(`Browser sees ${count} dealer title links`);
        }

        const data = await page.content();
        const $ = cheerio.load(data);
        const leads = [];

        // Logic Choice: Specialized or Discovery
        if (url.includes('www.yellowpages.com') || url.includes('m.yellowpages.com')) {
            console.error('Using specialized Yellow Pages extraction...');
            // Yellow Pages specialized logic (Cheerio based) will run later if leads empty
        } else {
            console.error('Using Discovery Mode for extraction...');
            const discoveredLeads = await page.evaluate((sourceUrl) => {
                const results = [];
                const phoneRegex = /\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g;
                const locationRegex = /\b([a-zA-Z\s.-]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?\b/;

                // Heuristic: Find all elements that look like they could be a dealer/business container
                // We look for divs that contain a phone number
                const allDivs = Array.from(document.querySelectorAll('div, section, article, li'));
                const candidateContainers = allDivs.filter(div => {
                    // Avoid very large containers (like body/main) and very small ones
                    const rect = div.getBoundingClientRect();
                    if (rect.width < 100 || rect.height < 50) return false;
                    if (rect.width > window.innerWidth * 0.9 && rect.height > window.innerHeight * 0.9) return false;
                    
                    const text = div.innerText || '';
                    return phoneRegex.test(text);
                });

                // Filter to get the "leaf" containers (closest to the data)
                const leafContainers = candidateContainers.filter(container => {
                    return !Array.from(container.querySelectorAll('*')).some(child => candidateContainers.includes(child));
                });

                leafContainers.forEach(container => {
                    const text = container.innerText || '';
                    const phones = text.match(phoneRegex);
                    const locationMatch = text.match(locationRegex);

                    // Find a name: usually the first heading or bold link
                    let name = '';
                    const heading = container.querySelector('h1, h2, h3, h4, h5, strong, b');
                    if (heading) {
                        name = heading.innerText.trim();
                    } else {
                        const link = container.querySelector('a');
                        if (link) name = link.innerText.trim();
                    }

                    // Clean name (remove phone if it's in the name element)
                    if (name) name = name.split('\n')[0].replace(phoneRegex, '').trim();

                    if (name && (phones || locationMatch)) {
                        let city = null, state = null, zip = null;
                        if (locationMatch) {
                            city = locationMatch[1].trim();
                            state = locationMatch[2].trim().toUpperCase();
                            zip = locationMatch[3] || null;
                        }

                        results.push({
                            companyName: name,
                            phoneNumber: phones ? phones[0] : null,
                            zipCode: zip,
                            city: city,
                            state: state,
                            website: null,
                            sourceUrl: sourceUrl
                        });
                    }
                });

                return results;
            }, url);

            console.error(`Discovery Mode found ${discoveredLeads.length} leads`);
            leads.push(...discoveredLeads);
        }

        // Mobile Yellow Pages Selectors
        if (leads.length === 0) {
            $('.result').each((_, element) => {
            const name = $(element).find('.business-name').text().trim();
            const phone = $(element).find('.phone').text().trim();
            const website = $(element).find('.track-visit-website').attr('href');

            // Extract zip code
            let zipCode = $(element).find('span[itemprop="postalCode"]').text().trim();
            if (!zipCode) {
                const locality = $(element).find('.locality').text().trim();
                const match = locality.match(/\b\d{5}(?:-\d{4})?\b/);
                if (match) zipCode = match[0];
            }

            // Extract city and state from locality
            let city = null;
            let stateAbbrev = null;
            const localityText = $(element).find('.locality').text().trim();
            if (localityText) {
                const parts = localityText.split(',');
                if (parts.length >= 2) {
                    city = parts[0].trim();
                    const stateZip = parts[1].trim().split(' ');
                    stateAbbrev = stateZip[0].trim();
                }
            }

            if (name && (phone || website)) {
                leads.push({
                    companyName: name,
                    phoneNumber: phone || null,
                    zipCode: zipCode || null,
                    city: city,
                    state: stateAbbrev,
                    website: website ? (website.startsWith('http') ? website : `https://www.yellowpages.com${website}`) : null,
                    sourceUrl: url
                });
            }
            });
        }

        // Fallback for desktop/other structures
        if (leads.length === 0) {
            $('.v-card').each((_, element) => {
                const name = $(element).find('a.business-name').text().trim();
                const phone = $(element).find('.phones.phone.primary').text().trim();
                const website = $(element).find('a.track-visit-website').attr('href');

                let zipCode = $(element).find('span[itemprop="postalCode"]').text().trim();
                if (!zipCode) {
                    const locality = $(element).find('.locality').text().trim();
                    const match = locality.match(/\b\d{5}(?:-\d{4})?\b/);
                    if (match) zipCode = match[0];
                }

                // Extract city and state from locality
                let city = null;
                let stateAbbrev = null;
                const localityText = $(element).find('.locality').text().trim();
                if (localityText) {
                    const parts = localityText.split(',');
                    if (parts.length >= 2) {
                        city = parts[0].trim();
                        const stateZip = parts[1].trim().split(' ');
                        stateAbbrev = stateZip[0].trim();
                    }
                }

                if (name && (phone || website)) {
                    leads.push({
                        companyName: name,
                        phoneNumber: phone || null,
                        zipCode: zipCode || null,
                        city: city,
                        state: stateAbbrev,
                        website: website ? (website.startsWith('http') ? website : `https://www.yellowpages.com${website}`) : null,
                        sourceUrl: url
                    });
                }
            });
        }

        console.log(JSON.stringify(leads));
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
}

const url = process.argv[2];
if (!url) {
    console.error('URL required');
    process.exit(1);
}

scrape(url);
