import { NextRequest, NextResponse } from 'next/server';
import { calculateMNTaxWithReasons, calculateMNTax, isValidMNLocation } from '@/lib/mn-tax-calculator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        const {
            address,
            city,
            county,
            zip,
            saleAmount,
            productType,
            isMarketplaceFacilitator
        } = body;

        // Validate required fields (saleAmount is now optional)
        if (!city || !county || !productType) {
            return NextResponse.json(
                { error: 'Missing required fields: city, county, productType' },
                { status: 400 }
            );
        }

        // Validate sale amount (optional, defaults to 1 for rate calculation)
        let amount = 1.0; // Default to $1 for calculating effective rates
        let isRateOnly = true; // Flag indicating this is rate-only
        
        if (saleAmount) {
            const parsed = parseFloat(saleAmount);
            if (!isNaN(parsed) && parsed > 0) {
                amount = parsed;
                isRateOnly = false;
            }
        }

        // Marketplace facilitator defaults to true (all items assumed to be sold through marketplace)
        const marketplace = isMarketplaceFacilitator !== false;

        // Validate product type
        if (!['vehicle', 'non-vehicle'].includes(productType)) {
            return NextResponse.json(
                { error: 'Product type must be "vehicle" or "non-vehicle"' },
                { status: 400 }
            );
        }

        // Validate location
        if (!isValidMNLocation(county, city)) {
            return NextResponse.json(
                { error: 'Invalid Minnesota county or city' },
                { status: 400 }
            );
        }

        // Calculate taxes with detailed applicability information
        const breakdown = calculateMNTaxWithReasons({
            address: address || '',
            city,
            county,
            zip: zip || '',
            saleAmount: amount,
            productType: productType as 'vehicle' | 'non-vehicle',
            isMarketplaceFacilitator: marketplace
        });

        return NextResponse.json({
            success: true,
            location: {
                address,
                city,
                county,
                zip,
                state: 'Minnesota'
            },
            transaction: {
                saleAmount: amount,
                productType,
                isMarketplaceFacilitator: marketplace,
                isRateOnly: isRateOnly
            },
            taxes: breakdown,
            notes: {
                vehicleExemptionApplied: productType === 'vehicle',
                exciseTaxApplied: breakdown.vehicleExciseTax > 0,
                marketplaceFacilitatorApplied: isMarketplaceFacilitator
            }
        });
    } catch (error) {
        console.error('Minnesota tax calculation error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate Minnesota sales tax' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const city = searchParams.get('city');
        const county = searchParams.get('county');
        const saleAmount = searchParams.get('saleAmount');
        const productType = searchParams.get('productType') || 'non-vehicle';
        // Default marketplace facilitator to true (all items assumed to be sold through marketplace)
        const isMarketplaceFacilitator = searchParams.get('isMarketplaceFacilitator') !== 'false';

        if (!city || !county) {
            return NextResponse.json(
                { error: 'Missing required parameters: city, county' },
                { status: 400 }
            );
        }

        // Handle optional sale amount
        let amount = 1.0; // Default to $1 for calculating effective rates
        let isRateOnly = true;
        
        if (saleAmount) {
            const parsed = parseFloat(saleAmount);
            if (!isNaN(parsed) && parsed > 0) {
                amount = parsed;
                isRateOnly = false;
            }
        }

        if (!['vehicle', 'non-vehicle'].includes(productType)) {
            return NextResponse.json(
                { error: 'Product type must be "vehicle" or "non-vehicle"' },
                { status: 400 }
            );
        }

        const breakdown = calculateMNTax({
            address: searchParams.get('address') || '',
            city,
            county,
            zip: searchParams.get('zip') || '',
            saleAmount: amount,
            productType: productType as 'vehicle' | 'non-vehicle',
            isMarketplaceFacilitator
        });

        return NextResponse.json({
            success: true,
            location: {
                city,
                county,
                state: 'Minnesota'
            },
            transaction: {
                saleAmount: amount,
                productType,
                isMarketplaceFacilitator,
                isRateOnly: isRateOnly
            },
            taxes: breakdown
        });
    } catch (error) {
        console.error('Minnesota tax calculation error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate Minnesota sales tax' },
            { status: 500 }
        );
    }
}
