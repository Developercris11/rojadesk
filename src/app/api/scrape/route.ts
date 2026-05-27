import { NextRequest, NextResponse } from 'next/server';
import { scrapeLeads } from '@/lib/scraper/scraper';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { url, category, state, city } = await req.json();
        console.log('API Request Received:', { url, category, state, city });

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const leads = await scrapeLeads(url);
        console.log(`Scraper returned ${leads.length} leads`);

        let newCount = 0;
        let duplicateCount = 0;
        let processedIds: string[] = [];

        for (const lead of leads) {
            // Check for duplicate
            const existing = await prisma.lead.findFirst({
                where: {
                    companyName: lead.companyName,
                    phoneNumber: lead.phoneNumber || undefined,
                }
            });

            // Manual override from request body takes precedence over scraped data
            const finalState = state || lead.state || null;
            const finalCity = city || lead.city || null;
            const finalCategory = category || lead.category || 'Motor Pool';

            if (existing) {
                // If existing, check if we should update location/category
                const needsUpdate = 
                    (finalState && existing.state !== finalState) ||
                    (finalCity && existing.city !== finalCity) ||
                    (finalCategory && existing.category !== finalCategory);

                if (needsUpdate) {
                    await prisma.lead.update({
                        where: { id: existing.id },
                        data: {
                            state: finalState || existing.state,
                            city: finalCity || existing.city,
                            category: finalCategory || existing.category,
                        }
                    });
                    newCount++; // Count as "processed/updated" for user feedback
                    processedIds.push(existing.id);
                } else {
                    duplicateCount++;
                    processedIds.push(existing.id);
                }
            } else {
                const newLead = await prisma.lead.create({
                    data: {
                        companyName: lead.companyName,
                        phoneNumber: lead.phoneNumber || 'N/A',
                        zipCode: lead.zipCode,
                        website: lead.website,
                        category: finalCategory,
                        state: finalState,
                        city: finalCity,
                        sourceUrl: url
                    }
                });
                newCount++;
                processedIds.push(newLead.id);
            }
        }

        return NextResponse.json({
            message: `Scrape completed: ${newCount} new leads added, ${duplicateCount} duplicates skipped.`,
            total: leads.length,
            newCount,
            duplicateCount,
            processedIds
        });

    } catch (error: any) {
        console.error('API Error:', error);
        
        const isCloudflare = error.message.includes('Cloudflare') || error.message.includes('Attention Required');
        const errorMessage = isCloudflare 
            ? 'Access temporarily blocked by directory (Cloudflare). Please try again in 5-10 minutes.' 
            : 'Failed to process leads';

        return NextResponse.json({
            error: errorMessage,
            details: error.message,
            isCloudflare
        }, { status: isCloudflare ? 403 : 500 });
    }
}
