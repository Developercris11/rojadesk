const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const XLSX = require('xlsx');

puppeteer.use(StealthPlugin());

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/scrape_findyello_aruba.js <url> [output.xlsx]');
  process.exit(1);
}

const url = args[0];
const outputFile = args[1] || path.join(process.cwd(), `findyello_aruba_${slugifyUrl(url)}.xlsx`);

function slugifyUrl(value) {
  return value
    .replace(/^https?:\/\//i, '')
    .replace(/[\/?=&]+/g, '_')
    .replace(/[^a-zA-Z0-9_\-]+/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function normalizeText(value) {
  if (!value) return null;
  return value.replace(/\s+/g, ' ').trim();
}

function normalizePhone(value) {
  if (!value) return null;
  const raw = value.replace(/[\n\r]/g, ' ').trim();
  const phoneMatch = raw.match(/\+?\d[\d\s\-\(\)\.]{5,}\d/);
  return phoneMatch ? normalizeText(phoneMatch[0]) : normalizeText(raw);
}

function createRecordKey(record) {
  return [record.companyName, record.address, record.phoneNumber]
    .filter(Boolean)
    .map(value => value.toLowerCase())
    .join('|');
}

async function scrapeProfileDetails(detailPage, profileUrl) {
  console.log(`Opening profile ${profileUrl}`);
  await detailPage.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise((resolve) => setTimeout(resolve, 900));

  const profileData = await detailPage.evaluate(() => {
    const normalize = (text) => {
      if (!text) return null;
      return text.replace(/\s+/g, ' ').trim();
    };

    const address = normalize(document.querySelector('address')?.innerText)
      || normalize(document.querySelector('.profile-side-contact')?.innerText)
      || normalize(document.querySelector('.profile-section.address')?.innerText);

    const phone = normalize(document.querySelector('.btn-phone')?.innerText)
      || normalize(document.querySelector('a.phone-number-link')?.innerText)
      || normalize(document.querySelector('a[href^="tel:"]')?.innerText)
      || (() => {
        const match = Array.from(document.querySelectorAll('a,span,div')).find((el) => {
          const text = normalize(el.innerText);
          return text && /\+?\d[\d\s\-\(\)\.]{6,}\d/.test(text);
        });
        return match ? normalize(match.innerText) : null;
      })();

    const website = normalize(
      Array.from(document.querySelectorAll('a[href^="http"]'))
        .find((a) => !/findyello\.com/i.test(a.href) && !/tel:/i.test(a.href) && !/mailto:/i.test(a.href))
        ?.href
    );

    return {
      address,
      phoneNumber: phone,
      website
    };
  });

  return profileData;
}

async function scrapePage(listPage, pageUrl) {
  console.log(`Opening page ${pageUrl}`);
  await listPage.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise((resolve) => setTimeout(resolve, 900));

  const rawLeads = await listPage.evaluate(() => {
    const normalize = (text) => {
      if (!text) return null;
      return text.replace(/\s+/g, ' ').trim();
    };

    const profileAnchors = Array.from(document.querySelectorAll('a')).filter((anchor) => {
      return anchor.href && /\/aruba\/.*\/profile\//i.test(anchor.href) && !/^(?:Directions|Explore|View Details|Details)$/i.test(normalize(anchor.innerText));
    });

    const leads = new Map();
    for (const anchor of profileAnchors) {
      const name = normalize(anchor.innerText);
      if (!name) continue;
      const profileUrl = anchor.href;
      if (!leads.has(profileUrl)) {
        leads.set(profileUrl, {
          companyName: name,
          profileUrl
        });
      }
    }

    return Array.from(leads.values());
  });

  return { results: rawLeads, nextPage: await listPage.evaluate(() => {
    const nextLink = Array.from(document.querySelectorAll('a')).find(a => /^\s*Next\s*$/i.test(a.innerText));
    if (nextLink) return nextLink.href;
    const linkNext = document.querySelector('link[rel="next"]');
    return linkNext ? linkNext.href : null;
  }) };
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const listPage = await browser.newPage();
    const detailPage = await browser.newPage();
    await listPage.setViewport({ width: 1280, height: 900 });
    await detailPage.setViewport({ width: 1280, height: 900 });
    await listPage.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    await detailPage.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    let currentUrl = url;
    const allLeads = [];
    const seenKeys = new Set();
    const visitedPages = new Set();

    while (currentUrl && !visitedPages.has(currentUrl)) {
      visitedPages.add(currentUrl);
      const { results, nextPage } = await scrapePage(listPage, currentUrl);
      console.log(`Found ${results.length} leads on page: ${currentUrl}`);

      for (const lead of results) {
        const profileDetails = await scrapeProfileDetails(detailPage, lead.profileUrl);
        const record = {
          companyName: lead.companyName,
          address: profileDetails.address || null,
          phoneNumber: profileDetails.phoneNumber || null,
          website: profileDetails.website || null,
          sourceUrl: currentUrl,
          profileUrl: lead.profileUrl
        };

        const key = createRecordKey(record);
        if (!key) continue;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        allLeads.push(record);
      }

      if (!nextPage || visitedPages.has(nextPage)) {
        break;
      }

      currentUrl = nextPage;
      console.log(`Following next page: ${currentUrl}`);
    }

    if (allLeads.length === 0) {
      console.log('No leads extracted from the provided URL.');
      process.exit(0);
    }

    const worksheet = XLSX.utils.json_to_sheet(
      allLeads.map((lead) => ({
        'Business Name': lead.companyName,
        'Address': lead.address,
        'Phone': lead.phoneNumber,
        'Website': lead.website,
        'Profile URL': lead.profileUrl,
        'Source URL': lead.sourceUrl
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FindYello Leads');
    XLSX.writeFile(workbook, outputFile);

    console.log(`Saved ${allLeads.length} unique leads to ${outputFile}`);
  } catch (error) {
    console.error('Scraper error:', error.message || error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
