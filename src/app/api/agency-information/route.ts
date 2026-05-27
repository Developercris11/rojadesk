import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

interface ContactPerson {
    fullName: string | null;
    jobTitle: string | null;
    email: string | null;
    phoneNumber: string | null;
    confidence: ConfidenceLevel;
}

interface AgencyData {
    organizationName: string | null;
    streetAddress: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    mainPhoneNumber: string | null;
    contacts: {
        townCityManager?: ContactPerson;
        publicWorksDirector?: ContactPerson;
        treasurerFinanceDirector?: ContactPerson;
        itManager?: ContactPerson;
        townCitySecretary?: ContactPerson;
        gatekeeper?: ContactPerson;
        additionalContacts: ContactPerson[];
    };
    extractedAt: string;
    sourceUrl: string;
    successfulPages: string[];
    errors?: string[];
}

interface ExtractedAgency {
    agencyName: string;
    state: string;
    zipCode: string;
    streetAddress: string | null;
    mainPhoneNumber: string | null;
    officialWebsite: string | null;
    contacts: {
        townCityManager?: ContactPerson;
        publicWorksDirector?: ContactPerson;
        treasurerFinanceDirector?: ContactPerson;
        itManager?: ContactPerson;
        townCitySecretary?: ContactPerson;
        gatekeeper?: ContactPerson;
        additionalContacts: ContactPerson[];
    };
    trustworthyDataFound: boolean;
    extractedAt: string;
    sourceUrl?: string;
    successfulPages: string[];
    errors?: string[];
}

function extractEmails(text: string): string[] {
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    return match ? Array.from(new Set(match)).filter(e => isValidEmail(e)) : [];
}

function extractPhones(text: string): string[] {
    const match = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g);
    return match ? Array.from(new Set(match)) : [];
}

function decodeCloudflareEmail(encodedEmail: string): string {
    try {
        if (!encodedEmail) return '';
        let decoded = '';
        const key = parseInt(encodedEmail.substring(0, 2), 16);
        for (let i = 2; i < encodedEmail.length; i += 2) {
            const char = parseInt(encodedEmail.substring(i, i + 2), 16) ^ key;
            decoded += String.fromCharCode(char);
        }
        return decoded;
    } catch {
        return '';
    }
}

// Validation functions for data quality
function isValidEmail(email: string | null): boolean {
    if (!email) return false;
    const blockedPatterns = ['none@none', 'test@test', 'example@example', 'invalid@', 'noemailavailable', 'noemail', 'placeholder'];
    if (blockedPatterns.some(p => email.toLowerCase().includes(p))) return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function isValidPhoneNumber(phone: string | null): boolean {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return false;
    if (/^0+$|^1+$|^2+$/.test(digits)) return false;
    return true;
}

function isGovernmentDomain(url: string): boolean {
    try {
        const domain = new URL(url).hostname.toLowerCase();
        return domain.includes('.gov') || domain.includes('city') || domain.includes('town') || domain.includes('county');
    } catch {
        return false;
    }
}

function getEmailConfidence(email: string | null, sourceUrl: string | null): ConfidenceLevel {
    if (!isValidEmail(email)) return 'none';
    if (!sourceUrl) return 'low';
    if (isGovernmentDomain(sourceUrl)) return 'high';
    return 'medium';
}

function getPhoneConfidence(phone: string | null, sourceUrl: string | null): ConfidenceLevel {
    if (!isValidPhoneNumber(phone)) return 'none';
    if (!sourceUrl) return 'low';
    if (isGovernmentDomain(sourceUrl)) return 'high';
    return 'medium';
}

function getRoleKey(title: string): keyof AgencyData['contacts'] | 'additionalContacts' {
    const t = title.toLowerCase();
    if ((t.includes('city') || t.includes('town') || t.includes('county')) && t.includes('manager')) return 'townCityManager';
    if (t.includes('mayor')) return 'townCityManager';
    if (t.includes('public works') || t.includes('utilities')) return 'publicWorksDirector';
    if (t.includes('finance') || t.includes('treasurer')) return 'treasurerFinanceDirector';
    if (t.includes('it ') || t.includes('technology') || t.includes('information')) return 'itManager';
    if (t.includes('secretary') || t.includes('clerk') || t.includes('recorder')) return 'townCitySecretary';
    if (t.includes('reception') || t.includes('front desk')) return 'gatekeeper';
    return 'additionalContacts';
}

function isValidName(text: string): boolean {
    const t = text.replace(/[()\[\]{}*]/g, ' ').replace(/\s+/g, ' ').trim();
    if (t.split(' ').length > 6 || t.split(' ').length < 2) return false;
    if (/[?|:/]/.test(t)) return false;
    const caps = t.match(/[A-Z]/g);
    if (!caps || caps.length < 2) return false;
    
    const blockedWords = ['email', 'phone', 'location', 'department', 'city', 'town', 'county', 'board', 'council'];
    if (blockedWords.some(w => t.toLowerCase() === w)) return false;
    return true;
}


async function crawlAgency(baseUrl: string): Promise<AgencyData> {
    const data: AgencyData = {
        organizationName: null,
        streetAddress: null,
        city: null,
        state: null,
        zipCode: null,
        mainPhoneNumber: null,
        contacts: { additionalContacts: [] },
        extractedAt: new Date().toISOString(),
        sourceUrl: baseUrl,
        successfulPages: [],
        errors: []
    };

    let urlObj;
    try {
        urlObj = new URL(baseUrl);
    } catch {
        return data;
    }
    
    const host = urlObj.hostname;
    const queue = [{ url: baseUrl, depth: 0 }];
    const visited = new Set<string>();
    
    const MAX_DEPTH = 3;
    const MAX_PAGES = 15;
    const PRIORITY_KEYWORDS = ['hall', 'mayor', 'clerk', 'official', 'elected', 'commission', 'council', 'board', 'contact', 'staff', 'directory', 'government', 'department', 'about', 'personnel', 'leadership'];

    let pageCount = 0;

    while (queue.length > 0 && pageCount < MAX_PAGES) {
        queue.sort((a, b) => {
            const aHasKeyword = PRIORITY_KEYWORDS.some(k => a.url.toLowerCase().includes(k));
            const bHasKeyword = PRIORITY_KEYWORDS.some(k => b.url.toLowerCase().includes(k));
            if (aHasKeyword && !bHasKeyword) return -1;
            if (!aHasKeyword && bHasKeyword) return 1;
            return a.depth - b.depth;
        });

        const currentItem = queue.shift();
        if (!currentItem) break;
        
        const cleanUrl = currentItem.url.split('#')[0];
        if (visited.has(cleanUrl)) continue;
        visited.add(cleanUrl);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            
            const response = await fetch(cleanUrl, { 
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) continue;
            
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('text/html')) continue;

            const html = await response.text();
            data.successfulPages.push(cleanUrl);
            pageCount++;
            
            const $ = cheerio.load(html);
            
            // Remove script, style, and navigation elements from analysis
            $('script, style, nav, svg').remove();
            
            // Extract Org Name
            if (!data.organizationName && currentItem.depth === 0) {
                // Priority 1: "City of X" patterns in body
                const topBody = $('body').text().substring(0, 3000);
                const cityTownMatch = topBody.match(/(?:City|Town|County|Village)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
                
                // Priority 2: Check H1
                const h1Text = $('h1').first().text().trim();
                
                // Priority 3: Check logo image alt
                const logoAlt = $('img[src*="logo"], img[class*="logo"], .logo img').first().attr('alt');

                if (cityTownMatch) {
                    data.organizationName = cityTownMatch[0].trim();
                } else if (h1Text && h1Text.length < 50 && isValidName(h1Text)) {
                    data.organizationName = h1Text;
                } else if (logoAlt && logoAlt.length < 50 && logoAlt.toLowerCase().includes('of')) {
                    data.organizationName = logoAlt;
                } else {
                    const titleText = $('title').text().replace(/[\n\t\r]/g, '').trim();
                    const splitTitle = titleText.split(/[-|]/);
                    data.organizationName = splitTitle.length > 0 ? splitTitle[0].trim() : titleText;
                }
            }

            // Map internal Links
            if (currentItem.depth < MAX_DEPTH) {
                $('a').each((_, el) => {
                    const href = $(el).attr('href');
                    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
                    
                    try {
                        const nextUrl = new URL(href, cleanUrl);
                        if (nextUrl.hostname === host || nextUrl.hostname.includes(host)) {
                            const cUrl = nextUrl.href.split('#')[0];
                            if (!visited.has(cUrl)) {
                                queue.push({ url: nextUrl.href, depth: currentItem.depth + 1 });
                            }
                        }
                    } catch (e) {}
                });
            }

            // Extract Global Address
            if (!data.state || !data.streetAddress) {
                // Remove scripts/styles again just in case
                $('script, style').remove();
                const searchableText = $('body').text().replace(/\s+/g, ' ').trim();
                
                // Matches "City, State ZIP" or "City State ZIP"
                const zipMatch = searchableText.match(/([A-Z][a-zA-Z\s\.]+)[,\s]+([A-Z]{2}|[A-Z][a-z]+[\sA-Za-z]*)[\s,]+(\d{5}(?:-\d{4})?)/);
                if (zipMatch && typeof zipMatch.index === 'number') {
                    data.city = zipMatch[1].trim();
                    data.state = zipMatch[2].trim();
                    data.zipCode = zipMatch[3].trim();
                    
                    const contextStart = Math.max(0, zipMatch.index - 100);
                    const beforeZip = searchableText.substring(contextStart, zipMatch.index);
                    const streetRegex = /(?:P\.O\.\s*Box\s*\d+|PO\s*Box\s*\d+|\d+\s+[A-Za-z0-9\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Way|Court|Ct|Pl|Place|Sq|Square|Pkwy|Parkway|Highway|Hwy|Complex|Suite\s+\d+|#\d+))/gi;
                    const streetMatches = Array.from(beforeZip.matchAll(streetRegex));
                    if (streetMatches.length > 0) {
                        data.streetAddress = streetMatches[streetMatches.length - 1][0].trim();
                    }
                }
            }
            
            // Extract global phone
            if (!data.mainPhoneNumber) {
                const headerFooterText = $('header, footer, .header, .footer, #header, #footer').text();
                const phones = extractPhones(headerFooterText);
                if (phones.length > 0) {
                    data.mainPhoneNumber = phones[0];
                } else if (currentItem.depth === 0) {
                    const allPhones = extractPhones($('body').text());
                    if (allPhones.length > 0) data.mainPhoneNumber = allPhones[0];
                }
            }

            // Parse Contacts (v4: Surgical scanning)
            // 1. Aggressively remove non-content areas
            $('nav, header, footer, .nav, .menu, .sidebar, .footer, #header, #footer, #sidebar, .header-v2, .footer-v2, .wsite-menu-default').remove();

            $('tr, .staff-member, .directory-item, .contact-block, div.paragraph, div.paragraph font, div.paragraph p, td, .wsite-multicol-col').each((_, el) => {
                // Ensure we don't process giant technical containers, only text-heavy blocks
                if ($(el).text().length > 1500) return;
                // If it's a column, we process it as a single block of potential contacts
                
                const rawHtml = $(el).html() || '';
                const lines = rawHtml.split(/<br[^>]*>|\r|\n/i).map(l => {
                    const block = $('<div>').html(l);
                    // Extract Cloudflare emails from data-cfemail
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

                if (lines.length === 0) return;

                const titlesList = ['Mayor', 'City Manager', 'Town Manager', 'Public Works', 'Utilities', 'Director', 'Treasurer', 'Finance', 'Clerk', 'Secretary', 'IT ', 'Technology', 'Information', 'Chief', 'Recorder', 'Alderman', 'Commissioner', 'Accounting', 'Payroll', 'Prosecutor', 'Judge', 'Superintendent'];

                const peopleInBlock: ContactPerson[] = [];
                let currentPerson: Partial<ContactPerson> | null = null;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    
                    // Check if current line is JUST a title
                    const exactTitleMatch = titlesList.find(t => line.text.toLowerCase() === t.toLowerCase());
                    
                    // Check if current line is "Name, Title" or "Title: Name"
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
                        potentialName = line.text.replace(matchedTitle, '')
                            .replace(/[()\[\]{}*]/g, ' ')
                            .replace(/^[-,\s:]+|[-,\s:]+$/g, '')
                            .trim();
                        // Clean possessives
                        if (potentialName.toLowerCase().endsWith("'s")) potentialName = '';
                    }

                    if (matchedTitle && isValidName(potentialName)) {
                        // NEW CONTACT found on one line
                        if (currentPerson && currentPerson.fullName) peopleInBlock.push(currentPerson as ContactPerson);
                        currentPerson = {
                            fullName: potentialName,
                            jobTitle: matchedTitle,
                            email: line.cfEmail || (line.emails.length > 0 ? line.emails[0] : null),
                            phoneNumber: extractPhones(line.text)[0] || null
                        };
                    } else if (isValidName(line.text)) {
                        // POTENTIAL NAME ONLY
                        if (currentPerson && currentPerson.fullName) peopleInBlock.push(currentPerson as ContactPerson);
                        currentPerson = {
                            fullName: line.text,
                            jobTitle: null,
                            email: line.cfEmail || (line.emails.length > 0 ? line.emails[0] : null),
                            phoneNumber: extractPhones(line.text)[0] || null
                        };
                    } else if (exactTitleMatch && currentPerson && !currentPerson.jobTitle) {
                        currentPerson.jobTitle = exactTitleMatch;
                    } else if (currentPerson) {
                        // Associate secondary info
                        if (!currentPerson.email) {
                            currentPerson.email = line.cfEmail || (line.emails.length > 0 ? line.emails[0] : null);
                        }
                        if (!currentPerson.phoneNumber) {
                            currentPerson.phoneNumber = extractPhones(line.text)[0] || null;
                        }
                    }
                }

                if (currentPerson && currentPerson.fullName) {
                    peopleInBlock.push(currentPerson as ContactPerson);
                }

                peopleInBlock.forEach(person => {
                    if (!person.fullName || !isValidName(person.fullName)) return;
                    const roleKey = getRoleKey(person.jobTitle || '');
                    if (roleKey === 'additionalContacts') {
                        if (!data.contacts.additionalContacts.some(c => c.fullName === person.fullName)) {
                            data.contacts.additionalContacts.push(person);
                        }
                    } else {
                        if (!data.contacts[roleKey] || !data.contacts[roleKey]?.fullName) {
                            data.contacts[roleKey] = person;
                        }
                    }
                });
            });
            
        } catch (e: any) {
            data.errors?.push(`Error on ${cleanUrl}: ${e.message}`);
        }
    }
    
    return data;
}

export async function POST(req: NextRequest) {
    try {
        const { agencyName, state, zipCode } = await req.json();

        if (!agencyName || !state || !zipCode) {
            return NextResponse.json(
                { error: 'Agency name, state, and zip code are required' },
                { status: 400 }
            );
        }

        const initialData: ExtractedAgency = {
            agencyName,
            state,
            zipCode,
            streetAddress: null,
            mainPhoneNumber: null,
            officialWebsite: null,
            contacts: { additionalContacts: [] },
            trustworthyDataFound: false,
            extractedAt: new Date().toISOString(),
            successfulPages: [],
            errors: []
        };

        // Find the official website
        const website = await findCityWebsite(agencyName, state, zipCode);
        
        if (!website) {
            return NextResponse.json({
                ...initialData,
                trustworthyDataFound: false,
                errors: ['Could not locate an official website for this agency. Verify information independently.']
            });
        }

        initialData.officialWebsite = website;

        // Extract data from the website
        const extractedData = await extractFromWebsite(website, agencyName);
        
        const result: ExtractedAgency = {
            agencyName,
            state,
            zipCode,
            streetAddress: extractedData.streetAddress || null,
            mainPhoneNumber: extractedData.mainPhoneNumber || null,
            officialWebsite: website,
            contacts: extractedData.contacts || { additionalContacts: [] },
            trustworthyDataFound: false,
            extractedAt: new Date().toISOString(),
            sourceUrl: website,
            successfulPages: extractedData.successfulPages || [],
            errors: extractedData.errors || []
        };

        result.trustworthyDataFound = determineDataTrustworthiness(result);

        if (!result.trustworthyDataFound) {
            result.errors?.push('No trustworthy contact information could be verified from the official website.');
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Agency information extraction error:', error);
        return NextResponse.json(
            { error: 'Failed to extract agency information' },
            { status: 500 }
        );
    }
}

async function findCityWebsite(agencyName: string, state: string, zipCode: string): Promise<string | null> {
    try {
        const cityName = agencyName.toLowerCase().replace(/city of |town of |county of |village of /gi, '').trim().replace(/\s+/g, '');
        const patterns = [
            // .gov patterns (highest priority)
            `${cityName}.gov`,
            `www.${cityName}.gov`,
            `city.${cityName}.gov`,
            `town.${cityName}.gov`,
            // cityof variations with all TLDs
            `cityof${cityName}.gov`,
            `www.cityof${cityName}.gov`,
            `cityof${cityName}.org`,
            `www.cityof${cityName}.org`,
            `cityof${cityName}.com`,
            `www.cityof${cityName}.com`,
            `cityof${cityName}.net`,
            `www.cityof${cityName}.net`,
            // .org variations
            `${cityName}.org`,
            `www.${cityName}.org`,
            `city.${cityName}.org`,
            `town.${cityName}.org`,
            // .com variations
            `${cityName}.com`,
            `www.${cityName}.com`,
            `city.${cityName}.com`,
            `town.${cityName}.com`,
            // .net variations
            `${cityName}.net`,
            `www.${cityName}.net`,
            `city.${cityName}.net`,
            `town.${cityName}.net`
        ];

        for (const pattern of patterns) {
            try {
                const response = await fetch(`https://${pattern}`, { 
                    method: 'HEAD',
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(3000)
                });
                if (response.ok) {
                    return `https://${pattern}`;
                }
            } catch {}
        }

        return null;
    } catch {
        return null;
    }
}

async function extractFromWebsite(website: string, agencyName: string): Promise<Partial<ExtractedAgency>> {
    const result: Partial<ExtractedAgency> = {
        contacts: { additionalContacts: [] },
        successfulPages: [],
        errors: []
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(website, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            result.errors?.push(`Failed to fetch website: ${response.status}`);
            return result;
        }

        const html = await response.text();
        result.successfulPages?.push(website);

        const $ = cheerio.load(html);
        
        // Extract main phone number
        const allText = $('body').text();
        const phoneMatches = extractPhones(allText);
        for (const phone of phoneMatches) {
            if (isValidPhoneNumber(phone)) {
                result.mainPhoneNumber = phone;
                break;
            }
        }

        // Extract street address
        const addressMatch = allText.match(/\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr)/i);
        if (addressMatch) {
            result.streetAddress = addressMatch[0];
        }

        // Extract contacts from staff directories
        const titlesList = ['Mayor', 'City Manager', 'Town Manager', 'Public Works', 'Utilities', 'Director', 'Treasurer', 'Finance', 'Clerk', 'Secretary', 'IT', 'Technology', 'Superintendent', 'Manager', 'Coordinator'];

        $('table tr, .staff-member, .directory-item, .contact-block, li, td').each((_, el) => {
            const rowText = $(el).text();
            if (rowText.length < 20 || rowText.length > 500) return;

            titlesList.forEach(title => {
                if (rowText.includes(title)) {
                    const nameMatch = rowText.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
                    const emailMatches = extractEmails(rowText);
                    const emailToUse = emailMatches.find(e => isValidEmail(e)) || null;
                    const phoneMatches = extractPhones(rowText);
                    const phoneToUse = phoneMatches.find(p => isValidPhoneNumber(p)) || null;

                    if (nameMatch && isValidName(nameMatch[0])) {
                        const contactPerson: ContactPerson = {
                            fullName: nameMatch[0],
                            jobTitle: title,
                            email: emailToUse,
                            phoneNumber: phoneToUse,
                            confidence: getEmailConfidence(emailToUse, website)
                        };

                        const roleKey = getRoleKey(title);
                        if (!result.contacts) result.contacts = { additionalContacts: [] };
                        
                        if (roleKey === 'additionalContacts') {
                            if (!result.contacts.additionalContacts?.some(c => c.fullName === contactPerson.fullName)) {
                                result.contacts.additionalContacts?.push(contactPerson);
                            }
                        } else {
                            if (!(result.contacts as any)[roleKey] || !(result.contacts as any)[roleKey]?.fullName) {
                                (result.contacts as any)[roleKey] = contactPerson;
                            }
                        }
                    }
                }
            });
        });

        return result;
    } catch (error: any) {
        result.errors?.push(`Extraction error: ${error.message}`);
        return result;
    }
}

function determineDataTrustworthiness(data: ExtractedAgency): boolean {
    // Must have at least one verified contact or valid phone/address
    const hasVerifiedContact = Object.keys(data.contacts).some(key => {
        const contact = (data.contacts as any)[key];
        return contact && contact.fullName && (
            (contact.email && isValidEmail(contact.email)) ||
            (contact.phoneNumber && isValidPhoneNumber(contact.phoneNumber))
        );
    });

    const hasValidPhone = !!(data.mainPhoneNumber && isValidPhoneNumber(data.mainPhoneNumber));
    const hasValidAddress = !!(data.streetAddress && data.streetAddress.length > 10);

    return hasVerifiedContact || hasValidPhone || hasValidAddress;
}
