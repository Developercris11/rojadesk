import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');
        const city = searchParams.get('city');
        const categoryParam = searchParams.get('category');
        const selectionsParam = searchParams.get('selections');
        const categories = categoryParam ? categoryParam.split(',') : undefined;
        const zipCode = searchParams.get('zipCode');
        const app = searchParams.get('app');

        let where: any = {
            state: state || undefined,
            city: city || undefined,
            category: categories ? { in: categories } : undefined,
            zipCode: zipCode || undefined,
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

        const leads = await prisma.lead.findMany({
            where,
            select: {
                companyName: true,
                phoneNumber: true,
                zipCode: true,
                website: true,
                category: true,
                state: true,
                city: true,
                sourceUrl: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (leads.length === 0) {
            const emptyWorksheet = XLSX.utils.json_to_sheet([]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, emptyWorksheet, 'No Leads');
            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            return new Response(excelBuffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename=export_empty.xlsx`
                }
            });
        }

        const workbook = XLSX.utils.book_new();

        // Group leads by city
       const cityGroups = leads.reduce(
  (acc: Record<string, Lead[]>, lead: Lead) => {
    const cityName = lead.city || 'Unclassified';

    if (!acc[cityName]) {
      acc[cityName] = [];
    }

    acc[cityName].push(lead);

    return acc;
  },
  {}
);

        // Create a sheet for each city
        Object.entries(cityGroups).forEach(([cityName, groupLeads]) => {
            const worksheet = XLSX.utils.json_to_sheet(groupLeads);
            // Excel sheet names: max 31 chars, no special chars
            const safeName = cityName.replace(/[\\/?*[\]:]/g, '_').substring(0, 31) || 'City';
            
            // Handle duplicate sheet names if normalization causes collisions
            let uniqueName = safeName;
            let counter = 1;
            while (workbook.SheetNames.includes(uniqueName)) {
                uniqueName = `${safeName.substring(0, 28)}_${counter++}`;
            }
            
            XLSX.utils.book_append_sheet(workbook, worksheet, uniqueName);
        });

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        const filename = `leads_export${state ? `_${state}` : ''}${zipCode ? `_${zipCode}` : ''}${categoryParam ? `_${categoryParam.replace(/[\s,]+/g, '_')}` : ''}.xlsx`;

        return new Response(excelBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=${filename}`
            }
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 });
    }
}
