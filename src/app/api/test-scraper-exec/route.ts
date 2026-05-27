import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        const scraperPath = path.join(process.cwd(), 'src', 'lib', 'scraper', 'standalone_scraper.js');
        const nodePath = process.execPath;
        
        console.log(`Testing scraper with URL: ${url}`);
        
        const { stdout, stderr } = await execPromise(`"${nodePath}" "${scraperPath}" "${url}"`, {
            maxBuffer: 10 * 1024 * 1024 // 10MB
        });
        
        return NextResponse.json({
            stdout: stdout.trim(),
            stderr: stderr.trim()
        });
    } catch (error: any) {
        return NextResponse.json({ 
            error: error.message,
            stderr: error.stderr,
            stdout: error.stdout
        }, { status: 500 });
    }
}
