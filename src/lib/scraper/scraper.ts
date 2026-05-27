import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface Lead {
    companyName: string;
    phoneNumber: string | null;
    zipCode: string | null;
    city: string | null;
    state: string | null;
    category?: string | null;
    website: string | null;
    sourceUrl: string;
}

export async function scrapeLeads(url: string): Promise<Lead[]> {
    try {
        // Adjusted for RojaDesk source structure
        const scraperPath = path.join(process.cwd(), 'src', 'lib', 'scraper', 'standalone_scraper.js');
        const nodePath = process.execPath;
        console.log(`Executing standalone scraper: "${nodePath}" "${scraperPath}" "${url}"`);

        // Execute the standalone script
        const { stdout, stderr } = await execPromise(`"${nodePath}" "${scraperPath}" "${url}"`, {
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large result sets
        });

        if (stderr) {
            console.warn('Standalone scraper stderr:', stderr);
        }

        if (!stdout || stdout.trim() === '') {
            console.log('No output from scraper');
            return [];
        }

        const leads: Lead[] = JSON.parse(stdout);
        console.log(`Successfully parsed ${leads.length} leads from standalone scraper`);

        return leads;

    } catch (error: any) {
        console.error(`Standalone scraper error: ${error.message}`);
        throw new Error(`Scraping failed: ${error.message}`);
    }
}
