import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json(
        { 
            success: false, 
            error: 'This endpoint requires Prisma configuration updates' 
        },
        { status: 503 }
    );
}
