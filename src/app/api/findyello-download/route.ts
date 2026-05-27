import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const url = body?.url;

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'A valid URL is required.' }, { status: 400 });
        }

        const tmpDir = path.join(process.cwd(), 'tmp', 'findyello');
        await fs.promises.mkdir(tmpDir, { recursive: true });

        const filename = `findyello_${Date.now()}.xlsx`;
        const outputFile = path.join(tmpDir, filename);
        const scriptPath = path.join(process.cwd(), 'scripts', 'scrape_findyello_aruba.js');
        const nodePath = process.execPath;

        console.log(`Starting FindYello scrape for: ${url}`);
        await execPromise(`"${nodePath}" "${scriptPath}" "${url}" "${outputFile}"`, {
            maxBuffer: 40 * 1024 * 1024
        });

        const fileBuffer = await fs.promises.readFile(outputFile);

        return new Response(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error: any) {
        console.error('FindYello download error:', error);
        return NextResponse.json({ error: error.message || 'Scraping failed.' }, { status: 500 });
    }
}
