import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
    try {
        const { ids, category, state } = await req.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
        }

        const data: any = {};
        if (category) data.category = category;
        if (state) data.state = state;

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
        }

        const result = await prisma.lead.updateMany({
            where: {
                id: { in: ids }
            },
            data
        });

        return NextResponse.json({ message: `${result.count} leads updated successfully` });

    } catch (error) {
        console.error('Bulk API Error:', error);
        return NextResponse.json({ error: 'Failed to bulk update leads' }, { status: 500 });
    }
}
