import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const totalCount = await prisma.lead.count();
        const provoCount = await prisma.lead.count({
            where: {
                OR: [
                    { city: { contains: 'Provo' } },
                    { city: { contains: 'provo' } }
                ]
            }
        });

        const recentProvo = await prisma.lead.findMany({
            where: {
                OR: [
                    { city: { contains: 'Provo' } },
                    { city: { contains: 'provo' } }
                ]
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            totalLeads: totalCount,
            provoLeadsCount: provoCount,
            recentProvoLeads: recentProvo
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
