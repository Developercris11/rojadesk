import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const potentialDuplicates = [
            { name: 'Naylor Auto', phone: '(801) 356-6959' },
            { name: 'Johnson Family Motors', phone: '(801) 851-0220' },
            { name: 'Autocraft', phone: '(801) 374-9000' },
            { name: 'Integrity Motors', phone: '(801) 592-7400' },
            { name: 'RPT Auto Sales', phone: '(385) 375-2132' }
        ];

        const results = [];
        for (const pd of potentialDuplicates) {
            const found = await prisma.lead.findFirst({
                where: {
                    OR: [
                        { companyName: { contains: pd.name } },
                        { phoneNumber: { contains: pd.phone.replace(/[^0-9]/g, '') } }
                    ]
                }
            });
            results.push({ search: pd, found: found ? { name: found.companyName, city: found.city, category: found.category, phone: found.phoneNumber } : null });
        }

        return NextResponse.json(results);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
