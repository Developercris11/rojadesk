const cheerio = require('cheerio');

function extractEmails(text) {
    const match = text.match(/[a-zA-Z0-9._%+-]+@?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    return match ? Array.from(new Set(match)).filter(e => e.includes('@')) : [];
}

function decodeCloudflareEmail(encoded) {
    if (!encoded) return '';
    try {
        let email = '';
        const r = parseInt(encoded.substring(0, 2), 16);
        for (let n = 2; encoded.length - n; n += 2) {
            const i = parseInt(encoded.substring(n, n + 2), 16) ^ r;
            email += String.fromCharCode(i);
        }
        return email;
    } catch (e) {
        return '';
    }
}

function isValidName(text) {
    const t = text.replace(/[()\[\]{}*]/g, ' ').replace(/\s+/g, ' ').trim();
    if (t.split(' ').length > 6 || t.split(' ').length < 2) return false;
    if (/\d/.test(t)) return false;
    const blockedWords = ['email', 'phone', 'location', 'department', 'city', 'town', 'county', 'board', 'council', 'police', 'fire', 'court', 'services', 'office', 'director', 'manager', 'contact', 'welcome', 'clerk', 'staff', 'address', 'monday', 'friday', 'closed', 'holiday', 'registry', 'compensation', 'workers', 'exemption', 'sign-up', 'sign up', 'login', 'log in', 'search', 'home', 'business', 'community', 'government', 'departments', 'how do i', 'subscribe', 'copyright', 'powered', 'job postings', 'job posting', 'careers', 'employment', 'opportunity', 'salary', 'apply', 'positions', 'vacancy', 'links of interest', 'links', 'utilities', 'bills', 'water bills', 'property taxes', 'taxes', 'vehicle'];
    if (blockedWords.some(w => t.toLowerCase() === w || t.toLowerCase().startsWith(w + ' ') || t.toLowerCase().endsWith(' ' + w))) return false;
    return true;
}

async function debug() {
    const url = 'https://www.townofalamo.net/city-hall.html';
    console.log('Fetching', url);
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    $('script, style, nav, svg').remove();

    const titlesList = ['Mayor', 'City Manager', 'Town Manager', 'Public Works', 'Utilities', 'Director', 'Treasurer', 'Finance', 'Clerk', 'Secretary', 'IT ', 'Technology', 'Information', 'Chief', 'Recorder', 'Alderman', 'Commissioner', 'Accounting', 'Payroll'];
    const contacts = [];

    $('tr, .staff-member, .directory-item, .contact-block, div, p').each((_, el) => {
        if ($(el).find('tr, .staff-member, .directory-item, .contact-block, div, p').length > 0) return;

        const rawHtml = $(el).html() || '';
        const lines = rawHtml.split(/<br[^>]*>|\r|\n/i).map(l => {
            const block = $('<div>').html(l);
            let cfEmail = '';
            block.find('[data-cfemail]').each((_, e) => {
                cfEmail = decodeCloudflareEmail($(e).attr('data-cfemail') || '');
            });
            return {
                text: block.text().replace(/\s+/g, ' ').trim(),
                cfEmail: cfEmail,
                emails: extractEmails(block.text() || '')
            };
        }).filter(l => l.text.length > 2);

        let currentPerson = null;
        for (const line of lines) {
            let matchedTitle = titlesList.find(t => line.text.includes(t));
            let potentialName = '';

            if (line.text.includes(',')) {
                const parts = line.text.split(',').map(p => p.trim());
                if (parts.length === 2 && titlesList.some(t => parts[1].includes(t))) {
                    potentialName = parts[0].replace(/[()\[\]{}*]/g, '').trim();
                    matchedTitle = titlesList.find(t => parts[1].includes(t));
                }
            }

            if (matchedTitle && !potentialName) {
                potentialName = line.text.replace(matchedTitle, '').replace(/[()\[\]{}*]/g, ' ').replace(/^[-,\s:]+|[-,\s:]+$/g, '').trim();
                if (potentialName.toLowerCase().endsWith("'s")) potentialName = '';
            }

            if (matchedTitle && isValidName(potentialName)) {
                if (currentPerson) contacts.push(currentPerson);
                currentPerson = { name: potentialName, title: matchedTitle, email: line.cfEmail || line.emails[0] || null };
            } else if (isValidName(line.text) && (!currentPerson || !currentPerson.name)) {
                currentPerson = { name: line.text.replace(/[()\[\]{}*]/g, '').trim(), title: null, email: line.cfEmail || line.emails[0] || null};
            } else if (currentPerson) {
                if (!currentPerson.email) currentPerson.email = line.cfEmail || line.emails[0] || null;
                if (!currentPerson.title && matchedTitle) currentPerson.title = matchedTitle;
            }
        }
        if (currentPerson) contacts.push(currentPerson);
    });

    console.log('EXTRACTED CONTACTS:', JSON.stringify(contacts, null, 2));
}

debug();
