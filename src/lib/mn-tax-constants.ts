/**
 * Minnesota Sales Tax Constants & Configuration
 * 
 * COMPLETE TAX STRUCTURE (as of April 2, 2026):
 * ============================================
 * 
 * 1. STATE TAX: 6.875% (always applies)
 *    - 6.5% to State General Fund
 *    - 0.375% to Arts & Environmental projects (since July 1, 2009)
 * 
 * 2. COUNTY-SPECIFIC TAX: varies by county
 *    - Hennepin: 0.15% (Twins stadium funding)
 *    - Other counties: 0% (need verification for Ramsey, Scott, Dakota, etc.)
 * 
 * 3. COUNTY TRANSIT TAX: 0.5% in 8 metro counties
 *    - Applies: Anoka, Carver, Chisago, Dakota, Hennepin, Ramsey, Scott, Washington
 *    - All other counties: 0%
 * 
 * 4. METRO AREA TRANSPORTATION TAX: 0.75%
 *    - ONLY in 7 Twin Cities metro counties: Anoka, Carver, Dakota, Hennepin, Ramsey, Scott, Washington
 *    - All other counties (including Chisago): 0%
 * 
 * 5. METRO AREA HOUSING TAX: 0.25%
 *    - ONLY in same 7 Twin Cities metro counties as Transportation tax
 *    - All other counties: 0%
 * 
 * 6. CITY ADDITIONAL TAX: varies by city
 *    - Most cities: 0% (no local option tax)
 *    - Mankato: +0.5% (special local tax since 1991)
 *    - Duluth, Minneapolis, Saint Paul, Rochester: rates built into combined totals
 *    - Note: City taxes are EXEMPT for vehicle sales statewide
 * 
 * 7. VEHICLE EXCISE TAX: $20 flat fee
 *    - ONLY for marketplace facilitator sales (not private sales)
 *    - Applies in 13 counties and 3 cities (see MN_EXCISE_TAX_COUNTIES/CITIES)
 * 
 * EXAMPLE CALCULATIONS:
 * =====================
 * New Hope, Hennepin County (non-vehicle):
 *   State (6.875%) + Hennepin County (0.15%) + County Transit (0.5%) 
 *   + Metro Transportation (0.75%) + Metro Housing (0.25%)
 *   = 8.525% effective rate
 * 
 * Rochester, Olmsted County (non-vehicle):
 *   State (6.875%) + County Transit (0%) + Metro Transportation (0%)
 *   + Metro Housing (0%) + City/County (0%) = 6.875%
 * 
 * Minneapolis, Hennepin County (non-vehicle):
 *   State (6.875%) + Hennepl County (0.15%) + County Transit (0.5%)
 *   + Metro Transportation (0.75%) + Metro Housing (0.25%)
 *   = 8.525% (7.775% shown in some sources includes meal/prepared food variations)
 * 
 * DATA SOURCES & CONFIDENCE LEVELS:
 * =================================
 * VERIFIED (✓):
 * - State tax 6.875% (official Minnesota DOR)
 * - Hennepl County 0.15% (Wikipedia, confirmed by user)
 * - County Transit Tax 0.5% (8 counties - Wikipedia)
 * - Metro Area Transportation 0.75% (7 counties - Wikipedia)
 * - Metro Area Housing 0.25% (7 counties - Wikipedia)
 * - Vehicle Excise Tax $20 (13 counties - Wikipedia)
 * 
 * NEEDS VERIFICATION (⚠):
 * - Other county-specific taxes (Ramsey, Scott, Dakota, etc.)
 * - City-specific taxes beyond Mankato
 * - Any changes after April 2026
 * 
 * USAGE:
 * It's critical to keep rates accurate to avoid requiring users to verify
 * calculations manually, which wastes their verification credits/resources.
 * Always update this file when tax rates change.
 */

// Minnesota State Sales Tax Rate
export const MN_STATE_TAX_RATE = 6.875; // 6.875% - ALWAYS APPLIES

// Counties with $20 Vehicle Excise Tax (as of 2025)
export const MN_EXCISE_TAX_COUNTIES = [
    'Anoka',
    'Beltrami',
    'Carlton',
    'Carver',
    'Dakota',
    'Goodhue',
    'Hennepin',
    'Kandiyohi',
    'Otter Tail',
    'Ramsey',
    'St. Louis',
    'Scott',
    'Washington'
];

// Cities with $20 Vehicle Excise Tax
export const MN_EXCISE_TAX_CITIES = [
    'Rogers',
    'Sauk Centre',
    'Willmar'
];

// County-Specific Sales Tax Rates (applies in specific counties)
// These are additional taxes beyond state tax
// References: Minnesota Department of Revenue, Wikipedia (verified April 2026)
export const MN_COUNTY_SPECIFIC_TAX_RATES: Record<string, number> = {
    'Hennepin': 0.15, // 0.150% - County-specific tax (Twins stadium - Target Field funding)
    // Note: Research needed for other potential county-specific taxes in:
    // Ramsey, Scott, Dakota, Carver, Anoka, Washington, St. Louis, etc.
    // All other counties: 0% (no county-specific tax beyond transit tax)
};

// County Transit Tax Rates (0.5% for metro and surrounding counties)
export const MN_COUNTY_TRANSIT_TAX_RATES: Record<string, number> = {
    'Anoka': 0.5,
    'Carver': 0.5,
    'Chisago': 0.5,
    'Dakota': 0.5,
    'Hennepin': 0.5,
    'Koochiching': 0.5, // County transit tax
    'Ramsey': 0.5,
    'Scott': 0.5,
    'Washington': 0.5,
    // All other counties: 0% (no county transit tax)
};

// Metro Area Transportation Tax (0.75% for Twin Cities metro area)
// Applied in Hennepin, Ramsey, Anoka, Dakota, Scott, Carver, Washington counties ONLY
export const MN_METRO_AREA_TRANSPORTATION_TAX = 0.75;
export const MN_METRO_TRANSPORTATION_COUNTIES = [
    'Anoka',
    'Carver',
    'Dakota',
    'Hennepin',
    'Ramsey',
    'Scott',
    'Washington'
];

// Metro Area Tax for Housing (0.25% for Twin Cities metro area)
// Applied in Hennepin, Ramsey, Anoka, Dakota, Scott, Carver, Washington counties ONLY
export const MN_METRO_AREA_HOUSING_TAX = 0.25;
export const MN_METRO_HOUSING_COUNTIES = [
    'Anoka',
    'Carver',
    'Dakota',
    'Hennepin',
    'Ramsey',
    'Scott',
    'Washington'
];

// City-specific additional taxes (on top of regional taxes)
// For cities that have their own local option sales tax
// References: Minnesota Department of Revenue, Wikipedia (verified April 2026)
// Note: City taxes are EXEMPT for vehicle sales statewide
export const MN_CITY_ADDITIONAL_TAX_RATES: Record<string, number> = {
    // Major cities with additional sales taxes beyond state/county/metro
    'Minneapolis': 0.0, // Local option tax already included in rate - verify breakdown
    'Saint Paul': 0.0, // Local option tax already included in rate - verify breakdown
    'Rochester': 0.0, // Local option tax already included in rate - verify breakdown
    'Duluth': 0.0, // Local option tax already included in rate - verify breakdown
    'International Falls': 1.0, // 1.0% additional (verified Apr 2026)
    'Mankato': 0.5, // 0.5% additional (since 1991)
    
    // All other cities: 0%
    'New Hope': 0.0, // No additional local tax
    'St. Cloud': 0.0,
    'Bloomington': 0.0,
    'Edina': 0.0,
    'Eagan': 0.0,
    'Plymouth': 0.0,
    'Coon Rapids': 0.0,
    'Rogers': 0.0,
    'Sauk Centre': 0.0,
    'Willmar': 0.0,
    'Forest Lake': 0.0,
};

export const VEHICLE_EXCISE_TAX = 20; // $20 flat fee in applicable areas

// Tax applicability reasons
export interface TaxApplicability {
    applies: boolean;
    reason: string;
}

export interface DetailedTaxBreakdown {
    stateTax: number;
    stateTaxApplicability: TaxApplicability;
    
    countySpecificTax: number;
    countySpecificTaxApplicability: TaxApplicability;
    
    countyTransitTax: number;
    countyTransitTaxApplicability: TaxApplicability;
    
    metroAreaTransportationTax: number;
    metroAreaTransportationApplicability: TaxApplicability;
    
    metroAreaHousingTax: number;
    metroAreaHousingApplicability: TaxApplicability;
    
    cityAdditionalTax: number;
    cityAdditionalTaxApplicability: TaxApplicability;
    
    vehicleExciseTax: number;
    vehicleExciseTaxApplicability: TaxApplicability;
    
    totalTax: number;
    effectiveRate: number;
}

export interface MNTaxBreakdown {
    stateTax: number;
    countySpecificTax: number;
    countyTransitTax: number;
    metroAreaTransportationTax: number;
    metroAreaHousingTax: number;
    cityAdditionalTax: number;
    vehicleExciseTax: number;
    totalTax: number;
    effectiveRate: number;
}

export interface MNTaxRequest {
    address: string;
    city: string;
    county: string;
    zip: string;
    saleAmount: number;
    productType: 'vehicle' | 'non-vehicle';
    isMarketplaceFacilitator: boolean;
}
