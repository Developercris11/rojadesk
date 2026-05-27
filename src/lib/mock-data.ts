export type AccountType = 'LARGE' | 'REGULAR';

export interface Agency {
    id: string;
    name: string;
    orgId: string;
    region: string;
    address?: string;
    city?: string;
    zip?: string;
    accountType: AccountType;
    lastCheckInDate: string | null;
    taxRate: number | null;
    salesUseTaxRate?: number | null;
    motorVehicleTaxRate?: number | null;
    assignedRep?: string;
}

export type AuctionCategory = 'Motor Pool' | 'Heavy Equipment' | 'Real Estate' | 'Industrial Equipment';

export interface AuctionItem {
    id: string;
    title: string;
    category: AuctionCategory;
    currentBid: number;
    location: {
        city: string;
        state: string;
        zip: string;
    };
    url: string;
    auctionId: string;
    endTime: string;
    // Detailed fields from Public Surplus
    highBidder?: string;
    bidCount?: number;
    firstOffer?: number;
    startTime?: string;
    seller?: string;
    pickupLocation?: string;
    paymentType?: string;
    shippingInfo?: string;
    description?: string;
    year?: string;
    make?: string;
    model?: string;
    vin?: string;
    mileage?: string;
}

export interface AuctionLead {
    id: string;
    companyName: string;
    phone: string;
    email: string;
    category: string;
    relevancy: 'HIGH' | 'MEDIUM' | 'LOW';
    auctionId: string;
    region: string;
    status: 'PENDING' | 'PUSHED' | 'DIALER_TASK' | 'EMAIL_SENT';
}

export const mockAgencies: Agency[] = [
    {
        id: '1',
        name: 'Blue Star Media',
        orgId: 'BSM-992',
        region: 'North East',
        address: '123 Media Way',
        city: 'New York',
        zip: '10001',
        accountType: 'LARGE',
        lastCheckInDate: '2026-01-15',
        taxRate: 6.25,
        salesUseTaxRate: 8.25,
        motorVehicleTaxRate: 8.55,
        assignedRep: 'Alex Rivera'
    },
    {
        id: '2',
        name: 'Red Rock Agency',
        orgId: 'RRA-102',
        region: 'South West',
        address: '456 Rock Rd',
        city: 'Phoenix',
        zip: '85001',
        accountType: 'REGULAR',
        lastCheckInDate: '2025-12-01',
        taxRate: 8.1,
        salesUseTaxRate: 8.1,
        motorVehicleTaxRate: 8.4,
        assignedRep: 'Sarah Jenkins'
    },
    {
        id: '3',
        name: 'Green Field Logistics',
        orgId: 'GFL-445',
        region: 'Midwest',
        address: '789 Field Ln',
        city: 'Chicago',
        zip: '60601',
        accountType: 'LARGE',
        lastCheckInDate: '2026-02-20',
        taxRate: 5.5,
        salesUseTaxRate: 5.5,
        motorVehicleTaxRate: 5.8,
        assignedRep: 'Alex Rivera'
    }
];
