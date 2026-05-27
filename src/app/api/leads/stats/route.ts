import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const app = searchParams.get('app');

        let whereClause: any = { state: { not: null } };
        if (app === 'gmaps') {
            whereClause.source = 'GMAPS';
        } else if (app === 'prospector') {
            whereClause.source = 'PROSPECTOR';
        }
        let stats: any[];
        if (app) {
            const source = app === 'gmaps' ? 'GMAPS' : 'PROSPECTOR';
            stats = await prisma.$queryRawUnsafe(`
                SELECT state, city, category, COUNT(*) as _count 
                FROM Lead 
                WHERE source = ? AND state IS NOT NULL 
                GROUP BY state, city, category
            `, source);
        } else {
            const groupResult = await (prisma.lead.groupBy({
                by: ['state', 'city', 'category'],
                _count: true,
                where: whereClause,
                orderBy: [
                    { state: 'asc' },
                    { city: 'asc' },
                    { category: 'asc' },
                ],
            }) as any);
            stats = groupResult;
        }

        // Transform into hierarchical structure: State -> City -> Category
        const hierarchy: any = {};
        stats.forEach((row: any) => {
            const state = row.state || 'Unknown';
            const city = row.city || 'Other';
            const category = row.category || 'Motor Pool';
            // queryRaw returns _count as a field, groupBy returns it as _count.true or similar.
            // In SQLite queryRaw, it's usually just _count or the alias we gave it.
            const count = Number(row._count || row.count || 0);

            if (!hierarchy[state]) {
                hierarchy[state] = {};
            }
            if (!hierarchy[state][city]) {
                hierarchy[state][city] = {};
            }
            hierarchy[state][city][category] = count;
        });

        return NextResponse.json(hierarchy);
    } catch (error) {
        console.error('Stats API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
