import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const state = searchParams.get('state');
        const categoryParam = searchParams.get('category');
        const zipCode = searchParams.get('zipCode');
        const city = searchParams.get('city');
        const app = searchParams.get('app');

        const selectionsParam = searchParams.get('selections');
        const categories = categoryParam ? categoryParam.split(',') : undefined;

        let where: any = {
            state: state || undefined,
            category: categories ? { in: categories } : undefined,
            zipCode: zipCode || undefined,
            city: city || undefined,
        };

        if (app === 'gmaps') {
            where.source = 'GMAPS';
        } else if (app === 'prospector') {
            where.source = 'PROSPECTOR';
        }

        if (selectionsParam) {
            const list = selectionsParam.split(',').map(s => {
                const [st, ct, cat] = s.split('|');
                return { state: st, city: ct, category: cat };
            });
            where.OR = list;
            delete where.state;
            delete where.city;
            delete where.category;
        }

        // use queryRaw if Prisma types are out of sync with the DB
        let leads: any[];
        if (app) {
            const source = app === 'gmaps' ? 'GMAPS' : 'PROSPECTOR';
            leads = await prisma.$queryRawUnsafe(`SELECT * FROM Lead WHERE source = ? ORDER BY createdAt DESC`, source);
        } else {
            leads = await prisma.lead.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            });
        }

        return NextResponse.json(leads);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, category, state, city } = await req.json();
        
        const lead = await prisma.lead.update({
            where: { id },
            data: {
                category: category !== undefined ? category : undefined,
                state: state !== undefined ? state : undefined,
                city: city !== undefined ? (city || null) : undefined,
            },
        });
        
        return NextResponse.json({ message: 'Lead updated successfully', lead });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    try {
        await prisma.lead.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Lead deleted' });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }
}
