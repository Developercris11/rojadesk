import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        console.log('Starting migration API...');
        
        const result = await prisma.lead.updateMany({
            where: {
                city: 'Lindon',
                category: {
                    in: ['General', 'Used Car Dealer', 'Used car dealer']
                }
            },
            data: {
                category: 'Motor Pool'
            }
        });

        return NextResponse.json({ 
            message: `Migration successful. Updated ${result.count} leads in Lindon.`,
            count: result.count
        });
    } catch (error: any) {
        console.error('Migration API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
