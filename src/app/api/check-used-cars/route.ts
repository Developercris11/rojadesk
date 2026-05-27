import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const usedCarDealers = await prisma.lead.findMany({
            where: {
                OR: [
                    { category: 'Used Car Dealer' },
                    { category: 'Used car dealer' },
                    { companyName: { contains: 'Motors' } },
                    { companyName: { contains: 'Auto' } }
                ]
            },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            count: usedCarDealers.length,
            leads: usedCarDealers
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
