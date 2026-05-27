"use client";

import { useState, useEffect } from "react";
import {
    Calculator,
    MapPin,
    DollarSign,
    Truck,
    Building2,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    ArrowRight,
    TrendingUp,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getExciseTaxCounties,
    getExciseTaxCities,
    hasVehicleExciseTax
} from "@/lib/mn-tax-calculator";
import { getCountyForCity } from "@/lib/mn-city-county-map";

interface MNTaxResult {
    stateTax: number;
    stateTaxApplicability?: { applies: boolean; reason: string };
    countySpecificTax: number;
    countySpecificTaxApplicability?: { applies: boolean; reason: string };
    countyTransitTax: number;
    countyTransitTaxApplicability?: { applies: boolean; reason: string };
    metroAreaTransportationTax: number;
    metroAreaTransportationApplicability?: { applies: boolean; reason: string };
    metroAreaHousingTax: number;
    metroAreaHousingApplicability?: { applies: boolean; reason: string };
    cityAdditionalTax: number;
    cityAdditionalTaxApplicability?: { applies: boolean; reason: string };
    vehicleExciseTax: number;
    vehicleExciseTaxApplicability?: { applies: boolean; reason: string };
    totalTax: number;
    effectiveRate: number;
}

interface CalculationResult {
    success: boolean;
    location: {
        address: string;
        city: string;
        county: string;
        zip: string;
        state: string;
    };
    transaction: {
        saleAmount: number;
        productType: string;
        isMarketplaceFacilitator: boolean;
    };
    taxes: MNTaxResult;
    notes: {
        vehicleExemptionApplied: boolean;
        exciseTaxApplied: boolean;
        marketplaceFacilitatorApplied: boolean;
    };
}

const MN_COUNTIES = [
    "Anoka", "Beltrami", "Benton", "Big Stone", "Blue Earth", "Brown",
    "Carlton", "Carver", "Cass", "Chippewa", "Chisago", "Clay", "Clearwater",
    "Cook", "Cottonwood", "Crow Wing", "Dakota", "Dodge", "Douglas", "Faribault",
    "Fillmore", "Freeborn", "Goodhue", "Grant", "Hennepin", "Houston", "Hubbard",
    "Isanti", "Itasca", "Jackson", "Kandiyohi", "Kittson", "Koochiching", "Lac Qui Parle",
    "Lake", "Lake of the Woods", "Le Sueur", "Lincoln", "Lyon", "Mahnomen", "Marshall",
    "Martin", "McLeod", "Meeker", "Mille Lacs", "Morrison", "Mower", "Murray",
    "Nicollet", "Nobles", "Norman", "Olmsted", "Otter Tail", "Owatonna", "Pennington",
    "Pine", "Pipestone", "Polk", "Pope", "Ramsey", "Red Lake", "Redwood", "Renville",
    "Rice", "Rock", "Roseau", "St. Louis", "Scott", "Sherburne", "Sibley", "Stearns",
    "Steele", "Stevens", "Swift", "Todd", "Traverse", "Wabasha", "Wadena", "Waseca",
    "Washington", "Watonwan", "Wilkin", "Winona", "Wright", "Yellow Medicine"
];

const MAJOR_MN_CITIES = [
    "Minneapolis", "St. Paul", "Rochester", "Duluth", "St. Cloud", "Bloomington",
    "Brooklyn Center", "Brooklyn Park", "Edina", "Eagan", "Plymouth", "Coon Rapids",
    "Rogers", "Sauk Centre", "Willmar", "Mankato", "Sunnydale", "Shoreview",
    "Maplewood", "Richfield", "Minnetonka", "Roseville", "Woodbury", "Maple Grove",
    "Crystal", "Saint Louis Park", "West St. Paul", "Fridley", "Inver Grove Heights",
    "Ramsey", "New Brighton", "Oakdale", "St. Michael", "Mounds View"
];

export default function MinnesotaTaxCalculatorPage() {
    const [searchMode, setSearchMode] = useState<"city" | "county">("city");
    const [formData, setFormData] = useState({
        address: "",
        city: "",
        county: "Hennepin",
        zip: "",
        saleAmount: "",
        productType: "non-vehicle" as "vehicle" | "non-vehicle",
        isMarketplaceFacilitator: true
    });

    const [isFetching, setIsFetching] = useState(false);
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [exciseTaxApplicable, setExciseTaxApplicable] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-populate county when city is entered (only in city mode)
    useEffect(() => {
        if (searchMode === "city" && formData.city.trim()) {
            const foundCounty = getCountyForCity(formData.city.trim());
            if (foundCounty) {
                setFormData(prev => ({ ...prev, county: foundCounty }));
            }
        }
    }, [formData.city, searchMode]);

    useEffect(() => {
        // Check if selected location has excise tax
        const applicable = hasVehicleExciseTax(formData.county, formData.city);
        setExciseTaxApplicable(applicable);
    }, [formData.county, formData.city]);

    if (!mounted) return null;

    const handleCalculate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Validation based on search mode
        if (searchMode === "city") {
            if (!formData.city || !formData.county) {
                setError("Please fill in city and county fields");
                return;
            }
        } else {
            // County mode
            if (!formData.county) {
                setError("Please select a county");
                return;
            }
        }

        // Sale amount is now optional - if not provided, defaults to $1 for rate calculation
        const amount = formData.saleAmount ? parseFloat(formData.saleAmount) : 1.0;

        setIsFetching(true);
        setError(null);

        try {
            const response = await fetch("/api/minnesota-tax", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    address: formData.address,
                    city: formData.city || formData.county, // Use county as city if not provided
                    county: formData.county,
                    zip: formData.zip,
                    saleAmount: amount,
                    productType: formData.productType,
                    isMarketplaceFacilitator: formData.isMarketplaceFacilitator
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to calculate tax");
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsFetching(false);
        }
    };

    const handleReset = () => {
        setFormData({
            address: "",
            city: "",
            county: "Hennepin",
            zip: "",
            saleAmount: "",
            productType: "non-vehicle",
            isMarketplaceFacilitator: false
        });
        setResult(null);
        setError(null);
    };

    const inputClass = "w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700";
    const labelClass = "block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1";

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Calculator size={16} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">State Compliance</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Minnesota Tax <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-500">Calculator</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">Accurate sales tax calculation for Minnesota transactions.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Form Panel */}
                <div className="lg:col-span-5">
                    <div className="glass-premium p-10 rounded-[3rem] shadow-2xl border-white/20 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-emerald-500/30 transition-all duration-1000" />

                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                            <MapPin size={24} className="text-emerald-500" />
                            Tax Parameters
                        </h2>

                        <form onSubmit={handleCalculate} className="space-y-6 relative z-10">
                            {/* Search Mode Toggle */}
                            <div className="space-y-3">
                                <label className={labelClass}>Search Mode *</label>
                                <div className="flex gap-3 p-1 bg-white/5 rounded-2xl border border-white/10">
                                    {[
                                        { value: "city", label: "By City", icon: Building2 },
                                        { value: "county", label: "By County", icon: MapPin }
                                    ].map((mode) => (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => {
                                                setSearchMode(mode.value as "city" | "county");
                                                setFormData(prev => ({ ...prev, city: "", county: "Hennepin" }));
                                            }}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm transition-all",
                                                searchMode === mode.value
                                                    ? "bg-emerald-500 text-white shadow-lg"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-white/5"
                                            )}
                                        >
                                            <mode.icon size={16} />
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Conditional Input: City Search Mode */}
                            {searchMode === "city" && (
                                <>
                                    {/* City Selection */}
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>City *</label>
                                        <input
                                            className={inputClass}
                                            type="text"
                                            placeholder="Enter city name..."
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            list="city-suggestions"
                                            required
                                        />
                                        <datalist id="city-suggestions">
                                            {MAJOR_MN_CITIES.map((city) => (
                                                <option key={city} value={city} />
                                            ))}
                                        </datalist>
                                    </div>

                                    {/* Auto-populated County (Read-only in city mode) */}
                                    {formData.city && (
                                        <div className="space-y-1.5">
                                            <label className={labelClass}>County (Auto-Populated)</label>
                                            <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl font-bold text-slate-900 dark:text-white">
                                                {formData.county}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Conditional Input: County Search Mode */}
                            {searchMode === "county" && (
                                <div className="space-y-1.5">
                                    <label className={labelClass}>County *</label>
                                    <select
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                                        value={formData.county}
                                        onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                                        required
                                    >
                                        {MN_COUNTIES.map((county) => (
                                            <option key={county} value={county}>
                                                {county}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Address (Optional) */}
                            <div className="space-y-1.5">
                                <label className={labelClass}>Street Address (Optional)</label>
                                <input
                                    className={inputClass}
                                    type="text"
                                    placeholder="123 Main St..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {/* ZIP Code (Optional) */}
                            <div className="space-y-1.5">
                                <label className={labelClass}>ZIP Code (Optional)</label>
                                <input
                                    className={inputClass}
                                    type="text"
                                    placeholder="55401"
                                    value={formData.zip}
                                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                />
                            </div>

                            {/* Sale Amount */}
                            <div className="space-y-1.5">
                                <label className={labelClass}>Sale Amount $ (Optional)</label>
                                <input
                                    className={inputClass}
                                    type="number"
                                    placeholder="Leave blank to see effective tax rate"
                                    value={formData.saleAmount}
                                    onChange={(e) => setFormData({ ...formData, saleAmount: e.target.value })}
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            {/* Product Type */}
                            <div className="space-y-3">
                                <label className={labelClass}>Product Type *</label>
                                <div className="flex gap-4">
                                    {[
                                        { value: "non-vehicle", label: "Non-Vehicle", icon: Building2 },
                                        { value: "vehicle", label: "Vehicle", icon: Truck }
                                    ].map((type) => (
                                        <label
                                            key={type.value}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all flex-1",
                                                formData.productType === type.value
                                                    ? "border-emerald-500 bg-emerald-500/10"
                                                    : "border-slate-200 dark:border-slate-800 hover:border-emerald-300"
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="productType"
                                                value={type.value}
                                                checked={formData.productType === type.value as any}
                                                onChange={(e) => setFormData({ ...formData, productType: e.target.value as "vehicle" | "non-vehicle" })}
                                                className="w-4 h-4 accent-emerald-500"
                                            />
                                            <type.icon size={18} className="text-emerald-500" />
                                            <span className="font-bold text-sm">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Marketplace Facilitator */}
                            {formData.productType === "vehicle" && (
                                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                                    <label className="flex items-center gap-3 cursor-default opacity-75">
                                        <input
                                            type="checkbox"
                                            checked={formData.isMarketplaceFacilitator}
                                            disabled
                                            className="w-5 h-5 accent-indigo-500 rounded"
                                        />
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">Marketplace Facilitator (Always)</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">All calculations assume marketplace facilitator sales</p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* Excise Tax Notice */}
                            {formData.productType === "vehicle" && exciseTaxApplicable && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                                    <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-sm text-amber-900 dark:text-amber-100">$20 Excise Tax Applicable</p>
                                        <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                                            {formData.county} County/City applies a $20 vehicle excise tax through marketplace facilitators.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold border border-rose-500/20">
                                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 pt-6">
                                <button
                                    type="submit"
                                    disabled={isFetching}
                                    className="glow-button w-full py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {isFetching ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin" />
                                            Calculating...
                                        </>
                                    ) : (
                                        <>
                                            Calculate Tax
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="w-full py-4 glass-premium text-slate-500 dark:text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-95 border border-white/10"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>

                        <div className="mt-10 pt-8 border-t border-white/10 text-center relative z-10">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Minnesota DOR Compliant • Updated 2025
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-7">
                    {result ? (
                        <div className="glass-premium p-12 rounded-[3rem] shadow-2xl border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-500 space-y-8">
                            {/* Success Indicator */}
                            <div className="flex items-start gap-4 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                                <CheckCircle size={24} className="text-emerald-500 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-black text-emerald-700 dark:text-emerald-400 text-sm">Calculation Complete</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">
                                        {result.location.city}, {result.location.county} County
                                    </p>
                                </div>
                            </div>

                            {/* Main Result Summary */}
                            <div className="text-center space-y-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Tax Due</p>
                                <p className="text-6xl font-black text-emerald-500 tracking-tighter">
                                    ${result.taxes.totalTax.toFixed(2)}
                                </p>
                                <p className="text-slate-600 dark:text-slate-300 font-bold">
                                    {result.transaction.saleAmount > 0 ? (
                                        <>
                                            Effective Rate: <span className="text-emerald-500">{result.taxes.effectiveRate.toFixed(3)}%</span>
                                        </>
                                    ) : null}
                                </p>
                            </div>

                            {/* Tax Breakdown */}
                            <div className="space-y-3 pt-8 border-t border-white/10">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Tax Applicability & Breakdown</p>

                                {/* State Tax */}
                                <div className="space-y-2 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">State Tax (6.875%)</p>
                                                <p className="text-xs text-slate-500">Minnesota State Rate</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-blue-500">${result.taxes.stateTax.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    {result.taxes.stateTaxApplicability && (
                                        <div className="flex items-start gap-2 pt-2 pl-5">
                                            <span className="text-green-600 dark:text-green-400 font-bold text-xs">✓ APPLIES</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{result.taxes.stateTaxApplicability.reason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* County-Specific Tax */}
                                <div className="space-y-2 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0 mt-1" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">County-Specific Tax</p>
                                                <p className="text-xs text-slate-500">{result.location.county} County</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${result.taxes.countySpecificTax > 0 ? "text-rose-500" : "text-slate-400"}`}>
                                                ${result.taxes.countySpecificTax.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {result.taxes.countySpecificTaxApplicability && (
                                        <div className="flex items-start gap-2 pt-2 pl-5">
                                            <span className={`font-bold text-xs ${result.taxes.countySpecificTaxApplicability.applies ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}>
                                                {result.taxes.countySpecificTaxApplicability.applies ? "✓ APPLIES" : "✗ DOES NOT APPLY"}
                                            </span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{result.taxes.countySpecificTaxApplicability.reason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* County Transit Tax */}
                                <div className="space-y-2 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">County Transit Tax (0.5%)</p>
                                                <p className="text-xs text-slate-500">{result.location.county} County</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${result.taxes.countyTransitTax > 0 ? "text-purple-500" : "text-slate-400"}`}>
                                                ${result.taxes.countyTransitTax.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {result.taxes.countyTransitTaxApplicability && (
                                        <div className="flex items-start gap-2 pt-2 pl-5">
                                            <span className={`font-bold text-xs ${result.taxes.countyTransitTaxApplicability.applies ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}>
                                                {result.taxes.countyTransitTaxApplicability.applies ? "✓ APPLIES" : "✗ DOES NOT APPLY"}
                                            </span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{result.taxes.countyTransitTaxApplicability.reason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Metro Area Transportation Tax */}
                                <div className="space-y-2 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">Metro Area Transportation (0.75%)</p>
                                                <p className="text-xs text-slate-500">Twin Cities Regional Tax</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${result.taxes.metroAreaTransportationTax > 0 ? "text-cyan-500" : "text-slate-400"}`}>
                                                ${result.taxes.metroAreaTransportationTax.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {result.taxes.metroAreaTransportationApplicability && (
                                        <div className="flex items-start gap-2 pt-2 pl-5">
                                            <span className={`font-bold text-xs ${result.taxes.metroAreaTransportationApplicability.applies ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}>
                                                {result.taxes.metroAreaTransportationApplicability.applies ? "✓ APPLIES" : "✗ DOES NOT APPLY"}
                                            </span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{result.taxes.metroAreaTransportationApplicability.reason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Metro Area Housing Tax */}
                                <div className="space-y-2 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">Metro Area Housing Tax (0.25%)</p>
                                                <p className="text-xs text-slate-500">Twin Cities Regional Tax</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${result.taxes.metroAreaHousingTax > 0 ? "text-teal-500" : "text-slate-400"}`}>
                                                ${result.taxes.metroAreaHousingTax.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {result.taxes.metroAreaHousingApplicability && (
                                        <div className="flex items-start gap-2 pt-2 pl-5">
                                            <span className={`font-bold text-xs ${result.taxes.metroAreaHousingApplicability.applies ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}>
                                                {result.taxes.metroAreaHousingApplicability.applies ? "✓ APPLIES" : "✗ DOES NOT APPLY"}
                                            </span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{result.taxes.metroAreaHousingApplicability.reason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* City Additional Tax */}
                                <div className="space-y-2 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">City Additional Tax</p>
                                                <p className="text-xs text-slate-500">{result.location.city} Local Tax</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${result.taxes.cityAdditionalTax > 0 ? "text-indigo-500" : "text-slate-400"}`}>
                                                ${result.taxes.cityAdditionalTax.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {result.taxes.cityAdditionalTaxApplicability && (
                                        <div className="flex items-start gap-2 pt-2 pl-5">
                                            <span className={`font-bold text-xs ${result.taxes.cityAdditionalTaxApplicability.applies ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}>
                                                {result.taxes.cityAdditionalTaxApplicability.applies ? "✓ APPLIES" : "✗ DOES NOT APPLY"}
                                            </span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{result.taxes.cityAdditionalTaxApplicability.reason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Vehicle Excise Tax */}
                                <div className="space-y-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">Vehicle Excise Tax</p>
                                                <p className="text-xs text-slate-500">$20 flat fee (Marketplace)</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${result.taxes.vehicleExciseTax > 0 ? "text-amber-600" : "text-slate-400"}`}>
                                                ${result.taxes.vehicleExciseTax.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {result.taxes.vehicleExciseTaxApplicability && (
                                        <div className="flex items-start gap-2 pt-2 pl-5">
                                            <span className={`font-bold text-xs ${result.taxes.vehicleExciseTaxApplicability.applies ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}>
                                                {result.taxes.vehicleExciseTaxApplicability.applies ? "✓ APPLIES" : "✗ DOES NOT APPLY"}
                                            </span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{result.taxes.vehicleExciseTaxApplicability.reason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="space-y-2 pt-8 border-t border-white/10">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Calculation Notes</p>

                                {result.notes.vehicleExemptionApplied && (
                                    <div className="flex items-start gap-2 text-xs p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <CheckCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-blue-900 dark:text-blue-200">
                                            <strong>Vehicle Exemption:</strong> City taxes are exempt for vehicle sales statewide.
                                        </p>
                                    </div>
                                )}

                                {result.notes.marketplaceFacilitatorApplied && (
                                    <div className="flex items-start gap-2 text-xs p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <CheckCircle size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-indigo-900 dark:text-indigo-200">
                                            <strong>Marketplace Facilitator:</strong> $20 vehicle excise tax applied per state requirements.
                                        </p>
                                    </div>
                                )}

                                {result.notes.exciseTaxApplied && (
                                    <div className="flex items-start gap-2 text-xs p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <Info size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-amber-900 dark:text-amber-200">
                                            <strong>Excise Tax Notice:</strong> This location has vehicle excise tax applicability.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Recalculate Button */}
                            <button
                                onClick={handleReset}
                                className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs border border-white/10 hover:bg-white/5 transition-all active:scale-95 text-slate-600 dark:text-slate-300"
                            >
                                Calculate Different Amount
                            </button>
                        </div>
                    ) : (
                        <div className="glass-premium p-12 rounded-[3rem] shadow-2xl border-white/20 dark:border-white/5 min-h-[600px] flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-slate-500/10 rounded-[2rem] flex items-center justify-center text-slate-400 mb-8 shadow-lg">
                                <Calculator size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Ready to Calculate</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 max-w-sm">
                                Enter your location and transaction details to see your Minnesota sales tax breakdown.
                            </p>
                            <div className="space-y-2 text-left text-xs text-slate-500 dark:text-slate-400">
                                <p className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                                    State & County Tax Rates
                                </p>
                                <p className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                                    Vehicle Exemptions & Excise Tax
                                </p>
                                <p className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                                    Marketplace Facilitator Rules
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
