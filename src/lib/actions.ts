"use server";

import { Resend } from 'resend';
import { isCheckInDue } from './utils';
import { Agency, AuctionItem } from './mock-data';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY || 're_placeholder');

export async function fetchTaxRate(address: string, city: string, zip: string) {
    if (!zip) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const url = `https://services.maps.cdtfa.ca.gov/api/taxrate/GetRateByAddress?Address=${encodeURIComponent(address || '')}&City=${encodeURIComponent(city || '')}&Zip=${encodeURIComponent(zip)}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            cache: 'no-store',
            signal: controller.signal
        });

        console.log(`CA Tax Lookup [${zip}]: Status ${response.status}`);

        if (!response.ok) {
            console.error(`CA Tax Lookup failed: ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        const result = Array.isArray(data) ? data[0] : data;
        const rawRate = result?.taxRateInfo?.[0]?.rate ?? result?.taxRateInfo?.[0]?.TaxRate ?? result?.taxRate ?? result?.TaxRate ?? result?.rate ?? result?.Rate ?? result?.totalRate ?? result?.TotalRate;

        if (typeof rawRate === 'number') {
            const finalRate = rawRate < 1 ? rawRate * 100 : rawRate;
            console.log(`Parsed CA Rate: ${finalRate}%`);
            return finalRate;
        }

        console.warn(`Could not find rate in CA response:`, data);
        return null;
    } catch (error) {
        console.error("Error fetching tax rate:", error);
        return null;
    }
}

export async function fetchWATaxRates(address: string, city: string, zip: string) {
    if (!zip) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    };

    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Build the DOR TaxReport URL with its specific delimiter <|>
        // This endpoint is used by the official website and provides separate, accurate rates for retail and vehicles.
        const params = [
            `TaxType=S`,
            `Src=0`,
            `TAXABLE=`,
            `Addr=${encodeURIComponent(address || '')}`,
            `City=${encodeURIComponent(city || '')}`,
            `Zip=${encodeURIComponent(zip)}`,
            `Zip1=`,
            `Year=${year}`,
            `SYear=${year}`,
            `Month=${month}`,
            `Mon=${month}`
        ].join('<|>');

        const url = `https://webgis.dor.wa.gov/TaxRateLookup/TaxReport.aspx?${params}`;
        const response = await fetch(url, { headers, cache: 'no-store', signal: controller.signal });

        if (!response.ok) return null;

        const html = await response.text();

        // Regex to extract the "Total tax rate" from the HTML response sections
        // tblSales = Standard Retail, tblCarSale = Motor Vehicle Sales/Leases
        const extractRate = (containerId: string) => {
            const regex = new RegExp(`${containerId}.*?Total tax rate.*?<b>([.\\d]+)<\\/b>`, 's');
            const match = html.match(regex);
            return match ? parseFloat(match[1]) * 100 : null;
        };

        const standardRate = extractRate('tblSales');
        const motorVehicleRate = extractRate('tblCarSale');

        if (standardRate !== null && motorVehicleRate !== null) {
            console.log(`WA Tax Success [${zip}]: Std ${standardRate}% / MV ${motorVehicleRate}%`);
            return {
                standardRate: parseFloat(standardRate.toFixed(3)),
                motorVehicleRate: parseFloat(motorVehicleRate.toFixed(3))
            };
        }

        return null;
    } catch (error) {
        console.error("Error fetching WA tax rate:", error);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function fetchCOTaxRates(address: string, city: string, zip: string) {
    if (!zip) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fullAddress = `${address || ''}, ${city || ''}, CO ${zip}`.trim().replace(/^, /, '');
    const snapshot = new Date().toISOString().split('T')[0];

    const v1Headers = {
        'Authorization': 'Bearer j9I0I9HntphoSofPh9u1IAUphLhMiwImtqTkfmtx',
        'referer': 'https://colorado.ttr.services/',
        'Origin': 'https://colorado.ttr.services',
        'atr-version': '1.0.0',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    try {
        // Step 1: Get Pinpoints (Places)
        const pinpointsRes = await fetch('https://api.ttr.services/v1/places.pinpoints', {
            method: 'POST',
            headers: v1Headers,
            body: JSON.stringify({
                queries: [`${fullAddress} Colorado`],
                snapshot
            }),
            signal: controller.signal
        });

        if (!pinpointsRes.ok) {
            console.error(`CO Pinpoint failed: ${pinpointsRes.status}`);
            return null;
        }

        const pinpointsJson = await pinpointsRes.json();
        const places = pinpointsJson.places?.[0]?.results;

        if (!places || places.length === 0) {
            console.error("No CO places found for address");
            return null;
        }

        const placeIds = places.filter((p: any) => p.placeId).map((p: any) => Number(p.placeId));

        // Step 2: Get Rates by Place
        const ratesRes = await fetch('https://api.ttr.services/v1/rates.byPlace', {
            method: 'POST',
            headers: v1Headers,
            body: JSON.stringify({
                placeIds,
                date: snapshot,
                taxTypeFilter: 2,
                taxTypeIds: [1, 10] // 1: Sales, 10: Auto Retail
            }),
            signal: controller.signal
        });

        if (!ratesRes.ok) {
            console.error(`CO Rates failed: ${ratesRes.status}`);
            return null;
        }

        const ratesJson = await ratesRes.json();
        const ratePlaces = ratesJson.places;
        if (!ratePlaces) return null;

        let standardRate = 0;
        let motorVehicleRate = 0;

        // Group by jurisdiction. Each key in ratePlaces is a placeId.
        Object.keys(ratePlaces).forEach((pid) => {
            const jurisdiction = ratePlaces[pid];
            const rates = jurisdiction.rates;
            if (!Array.isArray(rates)) return;

            let std = 0;
            let mv = 0;

            rates.forEach((rate: any) => {
                if (rate.taxTypeId === "1") {
                    std = rate.value;
                } else if (rate.taxTypeId === "10") {
                    mv = rate.value;
                }
            });

            standardRate += std;
            // Fallback to std if mv not found
            motorVehicleRate += mv || std;
        });

        console.log(`CO V1 Success [${zip}]: Std ${(standardRate * 100).toFixed(2)}% / MV ${(motorVehicleRate * 100).toFixed(2)}%`);

        return {
            standardRate: parseFloat((standardRate * 100).toFixed(3)),
            motorVehicleRate: parseFloat((motorVehicleRate * 100).toFixed(3))
        };

    } catch (error) {
        console.error("Error fetching CO tax rate (V1):", error);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function fetchLATaxRates(address: string, city: string, zip: string) {
    if (!zip) return null;

    // Louisiana state tax increased to 5.0% on Jan 1, 2025.
    // Local rates vary by parish/city. Since the official portal is reCAPTCHA protected,
    // we use a local lookup table for major jurisdictions to provide accurate estimates.
    const cleanZip = zip.substring(0, 5);
    let totalRate = 5.00; // Base State Rate fallback

    // Map of ZIP prefix or specific ZIPs to total 2025 rates (State + Local)
    const laRateTable: { [key: string]: number } = {
        // Acadia Parish
        "70526": 10.50, // Crowley
        // Orleans Parish (New Orleans)
        "701": 10.00,
        // East Baton Rouge Parish
        "708": 10.50,
        // Caddo Parish (Shreveport)
        "71101": 9.60, "71102": 9.60, "71103": 9.60, "71104": 9.60, "71105": 9.60, "71106": 9.60, "71107": 9.60, "71108": 9.60, "71109": 9.60,
        // Bossier Parish (Bossier City)
        "71111": 10.00, "71112": 10.00, "71113": 10.00,
        // Calcasieu Parish (Lake Charles)
        "70601": 10.75, "70602": 10.75, "70605": 10.75, "70606": 10.75, "70607": 10.75, "70611": 10.75, "70615": 10.75,
        // Lafayette Parish (Lafayette)
        "70501": 9.00, "70502": 9.00, "70503": 9.00, "70504": 9.00, "70505": 9.00, "70506": 9.00, "70507": 9.00, "70508": 9.00,
        // Jefferson Parish (Metairie, Kenner)
        "70001": 9.75, "70002": 9.75, "70003": 9.75, "70005": 9.75, "70006": 9.75, "70062": 9.75, "70065": 9.75,
        // Ouachita Parish (Monroe)
        "71201": 10.99, "71202": 10.99, "71203": 10.99,
        // Rapides Parish (Alexandria)
        "71301": 10.50, "71302": 10.50, "71303": 10.50,
        // St. Landry Parish (Opelousas)
        "70570": 10.75,
        // Tangipahoa Parish (Hammond)
        "70401": 10.50, "70403": 10.50,
        // St. Tammany Parish (Slidell)
        "70458": 9.63, "70459": 9.63, "70460": 9.63, "70461": 9.63,
    };

    // Check specific ZIP match first
    if (laRateTable[cleanZip]) {
        totalRate = laRateTable[cleanZip];
    } else {
        // Try 3-digit prefix match (useful for New Orleans 701xx, Baton Rouge 708xx)
        const prefix = cleanZip.substring(0, 3);
        if (laRateTable[prefix]) {
            totalRate = laRateTable[prefix];
        }
    }

    console.log(`LA Tax Lookup [${zip}]: Returning estimated rate ${totalRate}%.`);

    return {
        standardRate: totalRate,
        manualLookupUrl: `https://rates.salestaxportal.com/public`
    };
}

export async function fetchOKTaxRates(address: string, city: string, zip: string) {
    if (!zip) return null;

    const cleanZip = zip.substring(0, 5);
    const street = address ? encodeURIComponent(address) : "";
    const cityEncoded = city ? encodeURIComponent(city) : "";
    const zipEncoded = encodeURIComponent(cleanZip);

    // Oklahoma state tax is 4.5%.
    // Local rates vary by city/county. We use TaxJar's public calculator endpoint for accuracy.
    const taxJarUrl = `https://taxjar.netlify.app/.netlify/functions/calculator?street=${street}&city=${cityEncoded}&zip=${zipEncoded}&country=US`;

    try {
        const response = await fetch(taxJarUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data?.rate?.combined_rate) {
                const totalRate = parseFloat(data.rate.combined_rate) * 100;
                console.log(`OK Tax Lookup (TaxJar) [${zip}]: Returning accurate rate ${totalRate}%.`);
                return {
                    standardRate: totalRate,
                    manualLookupUrl: `https://taxproject.csa.ou.edu/Rate_Locator/address/`
                };
            }
        }
    } catch (error) {
        console.error("OK Tax Lookup (TaxJar) Error:", error);
    }

    // --- FALLBACK TO LOCAL TABLE ---
    console.log(`OK Tax Lookup (TaxJar) failed or no results. Using fallback table for [${zip}].`);
    let totalRate = 4.50; // Base State Rate fallback

    // Map of ZIP prefix or specific ZIPs to total 2025 rates (State + Local)
    const okRateTable: { [key: string]: number } = {
        // Altus (from user screenshot)
        "73521": 9.75,
        // Oklahoma City (mostly 731xx)
        "731": 8.625,
        // Tulsa (mostly 741xx)
        "741": 8.52,
        // Norman
        "73019": 8.75, "73026": 8.75, "73069": 8.75, "73070": 8.75, "73071": 8.75, "73072": 8.75,
        // Edmond
        "73003": 8.25, "73012": 8.25, "73013": 8.25, "73025": 8.25, "73034": 8.25,
        // Broken Arrow
        "74011": 8.917, "74012": 8.917, "74014": 8.917,
        // Lawton
        "73501": 9.00, "73505": 9.00, "73507": 9.00,
    };

    if (okRateTable[cleanZip]) {
        totalRate = okRateTable[cleanZip];
    } else {
        const prefix = cleanZip.substring(0, 3);
        if (okRateTable[prefix]) {
            totalRate = okRateTable[prefix];
        }
    }

    return {
        standardRate: totalRate,
        manualLookupUrl: `https://taxproject.csa.ou.edu/Rate_Locator/address/`
    };
}

export async function fetchALTaxRates(address: string, city: string, zip: string) {
    if (!zip) return null;

    const cleanZip = zip.substring(0, 5);
    const street = address ? encodeURIComponent(address) : "";
    const cityEncoded = city ? encodeURIComponent(city) : "";
    const zipEncoded = encodeURIComponent(cleanZip);

    // Alabama state tax is 4%.
    // Local rates vary by city/county. We use TaxJar's public calculator endpoint for accuracy.
    const taxJarUrl = `https://taxjar.netlify.app/.netlify/functions/calculator?street=${street}&city=${cityEncoded}&zip=${zipEncoded}&country=US`;

    try {
        const response = await fetch(taxJarUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data?.rate?.combined_rate && data.rate.state === "AL") {
                const totalRate = parseFloat(data.rate.combined_rate) * 100;
                console.log(`AL Tax Lookup (TaxJar) [${zip}]: Returning accurate rate ${totalRate}%.`);
                return {
                    standardRate: totalRate,
                    manualLookupUrl: `https://www.alabamainteractive.org/ador_taxrate_lookup/welcome.action`
                };
            }
        }
    } catch (error) {
        console.error("AL Tax Lookup (TaxJar) Error:", error);
    }

    // --- FALLBACK TO LOCAL TABLE ---
    console.log(`AL Tax Lookup (TaxJar) failed or no results. Using fallback table for [${zip}].`);
    let totalRate = 4.00; // Base State Rate fallback

    // Map of ZIP prefix or specific ZIPs to total 2025 rates (State + Local)
    const alRateTable: { [key: string]: number } = {
        // Birmingham
        "352": 10.0,
        // Montgomery
        "361": 10.0,
        "360": 10.0,
        // Mobile
        "366": 10.0,
        // Huntsville (9%)
        "358": 9.0,
        // Tuscaloosa
        "354": 10.0,
        // Auburn
        "36830": 9.0, "36832": 9.0, "36849": 9.0,
        // Hoover
        "35216": 9.5, "35236": 9.5, "35244": 9.5,
    };

    if (alRateTable[cleanZip]) {
        totalRate = alRateTable[cleanZip];
    } else {
        const prefix = cleanZip.substring(0, 3);
        if (alRateTable[prefix]) {
            totalRate = alRateTable[prefix];
        }
    }

    return {
        standardRate: totalRate,
        manualLookupUrl: `https://www.alabamainteractive.org/ador_taxrate_lookup/welcome.action`
    };
}

export interface AgencyRecord extends Agency {
    // Ensuring taxRate is consistent with the UI usage which expects it to be optional or a string
    displayTaxRate?: string;
}

export type VerificationSource = {
    name: string;
    rate: number | null;
    link: string;
};

export async function fetchMultiSourceTaxRates(address: string, city: string, zip: string, state: string): Promise<VerificationSource[]> {
    if (!zip) return [];

    const cleanZip = zip.substring(0, 5);
    const streetForAvalara = address || "1 Main St"; // Fallback to satisfy Avalara address requirement
    const streetEncoded = encodeURIComponent(address || ""); // Use original address for TaxJar if available
    const cityEncoded = encodeURIComponent(city);
    const zipEncoded = encodeURIComponent(cleanZip); // Use cleanZip for TaxJar/Avalara links
    const stateEncoded = encodeURIComponent(state);

    const results: VerificationSource[] = [];

    // 1. TaxJar
    let taxJarRate: number | null = null;
    try {
        // Use a fallback street if none provided to help TaxJar geolocation
        const taxJarStreet = streetEncoded || encodeURIComponent("1 Main St");
        const taxJarUrl = `https://taxjar.netlify.app/.netlify/functions/calculator?street=${taxJarStreet}&city=${cityEncoded}&zip=${zipEncoded}&country=US`;
        const response = await fetch(taxJarUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        if (response.ok) {
            const data = await response.json();
            if (data?.rate?.combined_rate) {
                taxJarRate = Math.round(parseFloat(data.rate.combined_rate) * 10000) / 100;
            }
        }
    } catch (e) {
        console.error("MultiSource TaxJar Error:", e);
    }
    results.push({
        name: "TaxJar",
        rate: taxJarRate,
        link: `https://www.taxjar.com/sales-tax-calculator?zip=${zipEncoded}`
    });

    // 2. Avalara
    let avalaraRate: number | null = null;
    try {
        // Map common state names to abbreviations for Avalara if needed
        const stateCode = state.length === 2 ? state : (state === "Utah" ? "UT" : state === "Colorado" ? "CO" : state === "California" ? "CA" : state === "Washington" ? "WA" : state === "Louisiana" ? "LA" : state === "Alabama" ? "AL" : state === "Oklahoma" ? "OK" : state === "Ohio" ? "OH" : state);
        const avalaraUrl = `https://avatax-prod.avlr.net/avalara/avatax/getresponse?lineAddress1=${streetForAvalara}&city=${cityEncoded}&region=${stateCode}&postalCode=${zipEncoded}`;
        const response = await fetch(avalaraUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.avalara.com/",
                "Origin": "https://www.avalara.com"
            }
        });
        if (response.ok) {
            const raw = await response.text();
            // Handle the double-encoded string behavior seen in research
            const cleaned = raw.startsWith('"') && raw.endsWith('"') ? JSON.parse(raw) : raw;
            const data = typeof cleaned === 'string' ? JSON.parse(cleaned) : cleaned;

            // Handle Avalara's dynamic response patterns
            if (data && typeof data.totalTax === 'number') {
                avalaraRate = Math.round(data.totalTax * 100) / 100;
            } else if (data && typeof data.totalTaxRate === 'number') {
                avalaraRate = Math.round(data.totalTaxRate * 10000) / 100;
            } else {
                // Sum only from specific jurisdiction lists, never from the root object's values
                const items = Array.isArray(data) ? data :
                    (data?.summary && Array.isArray(data.summary) ? data.summary :
                        (data?.data && Array.isArray(data.data) ? data.data : []));

                let total = 0;
                items.forEach((item: any) => {
                    const r = item?.rate !== undefined ? item.rate : (typeof item === 'number' ? item : 0);
                    if (r) total += parseFloat(r);
                });
                if (total > 0) {
                    avalaraRate = total < 1
                        ? (Math.round(total * 10000) / 100)
                        : (Math.round(total * 100) / 100);
                }
            }
        }
    } catch (e) {
        console.error("MultiSource Avalara Error:", e);
    }
    results.push({
        name: "Avalara",
        rate: avalaraRate,
        link: `https://www.avalara.com/taxrates/en/calculator.html`
    });

    // 3. Sales Tax Handbook
    let salesTaxHandbookRate: number | null = null;
    try {
        const stateSlug = state.toLowerCase().replace(/\s+/g, '-');
        const citySlug = city.toLowerCase().replace(/\s+/g, '-');
        // If we have a city, try the city-specific page; otherwise ZIP pattern
        let handbookUrl = citySlug
            ? `https://www.salestaxhandbook.com/${stateSlug}/rates/${citySlug}`
            : `https://www.salestaxhandbook.com/calculator/?zip=${zipEncoded}`;

        let hbkResponse = await fetch(handbookUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });

        // Fallback to ZIP search if city-specific page 404s
        if (!hbkResponse.ok && citySlug) {
            handbookUrl = `https://www.salestaxhandbook.com/calculator/?zip=${zipEncoded}`;
            hbkResponse = await fetch(handbookUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
            });
        }

        if (hbkResponse.ok) {
            const html = await hbkResponse.text();

            // 1. Target the combined rate row (flexible across tags)
            const combinedMatch = html.match(/Combined\s+Sales\s+Tax[^\d%]*(\d+\.?\d*)\s*%/i);

            // 2. Target the hero header (supports "is 8%", "Rate 2026 8%", etc.)
            const headerMatch = html.match(/sales\s+tax\s+rate\s+(?:\w+\s+)?(?:202\d\s+)?(?:is\s+)?(\d+\.?\d*)\s*%/i);

            if (combinedMatch && combinedMatch[1]) {
                salesTaxHandbookRate = parseFloat(combinedMatch[1]);
            } else if (headerMatch && headerMatch[1]) {
                salesTaxHandbookRate = parseFloat(headerMatch[1]);
            } else {
                // 3. Fallback: take the highest valid local rate found (between 1% and 12%)
                // This avoids penalties (15%) or prepared food rates while finding the combined value
                const anyRateMatches = html.match(/(\d+(?:\.\d{1,3})?)\s*%/g);
                if (anyRateMatches) {
                    const rates = anyRateMatches
                        .map(m => parseFloat(m))
                        .filter(r => r > 0 && r < 12.5);
                    if (rates.length > 0) {
                        salesTaxHandbookRate = Math.max(...rates);
                    }
                }
            }
        }
    } catch (e) {
        console.error("MultiSource SalesTaxHandbook Error:", e);
    }

    results.push({
        name: "Sales Tax Handbook",
        rate: salesTaxHandbookRate,
        link: city ? `https://www.salestaxhandbook.com/${state.toLowerCase().replace(/\s+/g, '-')}/rates/${city.toLowerCase().replace(/\s+/g, '-')}` : `https://www.salestaxhandbook.com/calculator?zip=${zipEncoded}`
    });

    return results;
}

export async function sendCheckInReminders(agencies: Agency[]) {
    const dueAgencies = agencies.filter(a => isCheckInDue(a.lastCheckInDate, a.accountType));

    if (dueAgencies.length === 0) return { success: true, message: "No check-ins due." };

    if (!RESEND_API_KEY || RESEND_API_KEY === 're_placeholder') {
        return {
            success: false,
            message: "Missing Resend API Key. Please add RESEND_API_KEY to your .env file."
        };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'RojaDesk <onboarding@resend.dev>',
            to: ['developercris11@gmail.com'],
            subject: `Action Required: ${dueAgencies.length} Agency Check-ins Due`,
            html: `
                <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb; font-size: 24px;">Check-in Digest</h1>
                    <p>The following agencies are due for their periodic check-in:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Agency</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Type</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Last Check-in</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dueAgencies.map(a => `
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${a.name}</td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${a.salesUseTaxRate || 'N/A'}%</td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${a.motorVehicleTaxRate || 'N/A'}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top: 30px; padding: 20px; background: #eff6ff; border-radius: 12px;">
                        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e3a8a;">Pro Tip:</p>
                        <p style="margin: 5px 0 0; font-size: 14px; color: #1e40af;">You can manage these check-ins directly on your dashboard.</p>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: false, message: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("Email error:", error);
        return { success: false, message: error.message };
    }
}

export async function sendSingleCheckInReminder(agency: Agency) {
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_placeholder') {
        return {
            success: false,
            message: "Missing Resend API Key. Please add RESEND_API_KEY to your .env file."
        };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'RojaDesk <onboarding@resend.dev>',
            to: ['developercris11@gmail.com'],
            subject: `Action Required: Check-in Due for ${agency.name}`,
            html: `
                <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb; font-size: 24px;">Individual Check-in Alert</h1>
                    <p>An agency requires immediate attention:</p>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;">${agency.name}</p>
                        <p style="margin: 5px 0 0; color: #64748b;">Org ID: ${agency.orgId}</p>
                        <hr style="margin: 15px 0; border: 0; border-top: 1px solid #e2e8f0;" />
                        <p style="margin: 0; font-size: 14px;"><strong>Sales & Use Tax:</strong> ${agency.salesUseTaxRate || '0'}%</p>
                        <p style="margin: 5px 0 0; font-size: 14px;"><strong>Motor Vehicle Tax:</strong> ${agency.motorVehicleTaxRate || '0'}%</p>
                        <p style="margin: 5px 0 0; font-size: 14px; color: #ef4444;"><strong>Status:</strong> Overdue</p>
                    </div>
                    <div style="margin-top: 30px; padding: 20px; background: #eff6ff; border-radius: 12px;">
                        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e3a8a;">Next Step:</p>
                        <p style="margin: 5px 0 0; font-size: 14px; color: #1e40af;">Please contact the assigned representative or the agency directly.</p>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: false, message: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("Email error:", error);
        return { success: false, message: error.message };
    }
}

// --- AUCTION MARKETING INTELLIGENCE ---
// Feature removed. balance.
