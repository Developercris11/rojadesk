import {
    MN_STATE_TAX_RATE,
    MN_EXCISE_TAX_COUNTIES,
    MN_EXCISE_TAX_CITIES,
    MN_COUNTY_SPECIFIC_TAX_RATES,
    MN_COUNTY_TRANSIT_TAX_RATES,
    MN_METRO_AREA_TRANSPORTATION_TAX,
    MN_METRO_TRANSPORTATION_COUNTIES,
    MN_METRO_AREA_HOUSING_TAX,
    MN_METRO_HOUSING_COUNTIES,
    MN_CITY_ADDITIONAL_TAX_RATES,
    VEHICLE_EXCISE_TAX,
    DetailedTaxBreakdown,
    MNTaxBreakdown,
    MNTaxRequest,
    TaxApplicability
} from './mn-tax-constants';

/**
 * Calculates Minnesota sales tax with detailed applicability information
 * Shows why each tax applies or doesn't apply
 */
export function calculateMNTaxWithReasons(request: MNTaxRequest): DetailedTaxBreakdown {
    const {
        city,
        county,
        saleAmount,
        productType,
        isMarketplaceFacilitator
    } = request;

    let stateTax = 0;
    let countySpecificTax = 0;
    let countyTransitTax = 0;
    let metroAreaTransportationTax = 0;
    let metroAreaHousingTax = 0;
    let cityAdditionalTax = 0;
    let vehicleExciseTax = 0;

    // STATE TAX (Always applies)
    stateTax = saleAmount * (MN_STATE_TAX_RATE / 100);
    const stateTaxApplicability: TaxApplicability = {
        applies: true,
        reason: "Minnesota requires 6.875% state sales tax on all taxable sales"
    };

    // COUNTY-SPECIFIC TAX (e.g., Hennepin County 0.15%)
    const countySpecificRate = MN_COUNTY_SPECIFIC_TAX_RATES[county] || 0;
    countySpecificTax = saleAmount * (countySpecificRate / 100);
    const countySpecificTaxApplicability: TaxApplicability = countySpecificRate > 0
        ? {
            applies: true,
            reason: `${county} County imposes a ${countySpecificRate}% county-specific sales tax`
        }
        : {
            applies: false,
            reason: `${county} County does not impose a county-specific sales tax`
        };

    // COUNTY TRANSIT TAX (0.5% for 8 counties)
    const countyTransitRate = MN_COUNTY_TRANSIT_TAX_RATES[county] || 0;
    countyTransitTax = saleAmount * (countyTransitRate / 100);
    const countyTransitTaxApplicability: TaxApplicability = countyTransitRate > 0
        ? {
            applies: true,
            reason: `${county} County imposes a 0.5% county transit tax (began 2008-2025 depending on county)`
        }
        : {
            applies: false,
            reason: `${county} County does not impose a county transit tax`
        };

    // METRO AREA TRANSPORTATION TAX
    const hasMetroTransportation = MN_METRO_TRANSPORTATION_COUNTIES.includes(county);
    if (hasMetroTransportation) {
        metroAreaTransportationTax = saleAmount * (MN_METRO_AREA_TRANSPORTATION_TAX / 100);
    }
    const metroAreaTransportationApplicability: TaxApplicability = hasMetroTransportation
        ? {
            applies: true,
            reason: `${county} County is part of the Twin Cities metro area and applies 0.75% Metro Area Transportation tax (for transit expansion)`
        }
        : {
            applies: false,
            reason: `${county} County is not part of the Twin Cities metro area (only Anoka, Carver, Dakota, Hennepin, Ramsey, Scott, Washington apply)`
        };

    // METRO AREA HOUSING TAX
    const hasMetroHousing = MN_METRO_HOUSING_COUNTIES.includes(county);
    if (hasMetroHousing) {
        metroAreaHousingTax = saleAmount * (MN_METRO_AREA_HOUSING_TAX / 100);
    }
    const metroAreaHousingApplicability: TaxApplicability = hasMetroHousing
        ? {
            applies: true,
            reason: `${county} County is part of the Twin Cities metro area and applies 0.25% Metro Area Tax for Housing`
        }
        : {
            applies: false,
            reason: `${county} County is not part of the Twin Cities metro area (only Anoka, Carver, Dakota, Hennepin, Ramsey, Scott, Washington apply)`
        };

    // CITY ADDITIONAL TAX (EXEMPT for vehicles)
    let cityAdditionalTaxApplicability: TaxApplicability;
    if (productType === 'vehicle') {
        cityAdditionalTaxApplicability = {
            applies: false,
            reason: `Vehicle sales are EXEMPT from city taxes statewide per Minnesota law`
        };
    } else {
        const cityRate = MN_CITY_ADDITIONAL_TAX_RATES[city] || 0;
        cityAdditionalTax = saleAmount * (cityRate / 100);
        cityAdditionalTaxApplicability = cityRate > 0
            ? {
                applies: true,
                reason: `${city} imposes a local option sales tax of ${cityRate}%`
            }
            : {
                applies: false,
                reason: `${city} does not impose a local city sales tax`
            };
    }

    // VEHICLE EXCISE TAX ($20 flat fee)
    let vehicleExciseTaxApplicability: TaxApplicability;
    if (productType !== 'vehicle') {
        vehicleExciseTaxApplicability = {
            applies: false,
            reason: `$20 vehicle excise tax only applies to vehicle sales, not non-vehicle items`
        };
    } else if (!isMarketplaceFacilitator) {
        vehicleExciseTaxApplicability = {
            applies: false,
            reason: `$20 vehicle excise tax only applies to sales through marketplace facilitators`
        };
    } else if (!MN_EXCISE_TAX_COUNTIES.includes(county) && !MN_EXCISE_TAX_CITIES.includes(city)) {
        vehicleExciseTaxApplicability = {
            applies: false,
            reason: `${county} County / ${city} does not have a $20 vehicle excise tax (only applies in 13 specific counties and 3 cities)`
        };
    } else {
        vehicleExciseTax = VEHICLE_EXCISE_TAX;
        vehicleExciseTaxApplicability = {
            applies: true,
            reason: `$20 vehicle excise tax applies to marketplace facilitator vehicle sales in ${county} County. Collected and remitted to MN DOR via Sales & Use Tax return.`
        };
    }

    const totalTax = stateTax + countySpecificTax + countyTransitTax + metroAreaTransportationTax + metroAreaHousingTax + cityAdditionalTax + vehicleExciseTax;
    const effectiveRate = saleAmount > 0 ? (totalTax / saleAmount) * 100 : 0;

    return {
        stateTax: parseFloat(stateTax.toFixed(2)),
        stateTaxApplicability,
        
        countySpecificTax: parseFloat(countySpecificTax.toFixed(2)),
        countySpecificTaxApplicability,
        
        countyTransitTax: parseFloat(countyTransitTax.toFixed(2)),
        countyTransitTaxApplicability,
        
        metroAreaTransportationTax: parseFloat(metroAreaTransportationTax.toFixed(2)),
        metroAreaTransportationApplicability,
        
        metroAreaHousingTax: parseFloat(metroAreaHousingTax.toFixed(2)),
        metroAreaHousingApplicability,
        
        cityAdditionalTax: parseFloat(cityAdditionalTax.toFixed(2)),
        cityAdditionalTaxApplicability,
        
        vehicleExciseTax: parseFloat(vehicleExciseTax.toFixed(2)),
        vehicleExciseTaxApplicability,
        
        totalTax: parseFloat(totalTax.toFixed(2)),
        effectiveRate: parseFloat(effectiveRate.toFixed(3))
    };
}

/**
 * Calculates Minnesota sales tax (backward compatible)
 */
export function calculateMNTax(request: MNTaxRequest): MNTaxBreakdown {
    const detailed = calculateMNTaxWithReasons(request);
    return {
        stateTax: detailed.stateTax,
        countySpecificTax: detailed.countySpecificTax,
        countyTransitTax: detailed.countyTransitTax,
        metroAreaTransportationTax: detailed.metroAreaTransportationTax,
        metroAreaHousingTax: detailed.metroAreaHousingTax,
        cityAdditionalTax: detailed.cityAdditionalTax,
        vehicleExciseTax: detailed.vehicleExciseTax,
        totalTax: detailed.totalTax,
        effectiveRate: detailed.effectiveRate
    };
}

/**
 * Validates Minnesota county/city combinations
 */
export function isValidMNLocation(county: string, city: string): boolean {
    // Basic validation - can be extended with actual county-city mappings
    return (!!county && county.length > 0 && !!city && city.length > 0);
}

/**
 * Checks if a county/city has the $20 vehicle excise tax
 */
export function hasVehicleExciseTax(county: string, city: string): boolean {
    return MN_EXCISE_TAX_COUNTIES.includes(county) || MN_EXCISE_TAX_CITIES.includes(city);
}

/**
 * Gets all Minnesota counties with excise tax
 */
export function getExciseTaxCounties(): string[] {
    return MN_EXCISE_TAX_COUNTIES;
}

/**
 * Gets all Minnesota cities with excise tax
 */
export function getExciseTaxCities(): string[] {
    return MN_EXCISE_TAX_CITIES;
}
