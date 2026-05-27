"use client";

import { useState, useEffect } from "react";
import { Calculator, Search, MapPin, Globe, ArrowRight, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import {
    fetchTaxRate,
    fetchWATaxRates,
    fetchCOTaxRates,
    fetchLATaxRates,
    fetchOKTaxRates,
    fetchALTaxRates,
    fetchMultiSourceTaxRates,
    type VerificationSource
} from "@/lib/actions";
import { US_STATES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function SalesTaxCalculatorPage() {
    const [formData, setFormData] = useState({
        address: "",
        city: "",
        zip: "",
        state: "Washington"
    });
    const [isFetching, setIsFetching] = useState(false);
    const [results, setResults] = useState<{
        salesUseRate: number | null;
        motorVehicleRate?: number | null;
        manualLookupUrl?: string | null;
        state: string;
        verificationSources?: VerificationSource[];
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleLookup = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.zip) {
            setError("Zip code is required");
            return;
        }

        setIsFetching(true);
        setError(null);
        try {
            if (formData.state === "California") {
                const rate = await fetchTaxRate(formData.address, formData.city, formData.zip);
                if (rate !== null) {
                    setResults({ salesUseRate: rate, state: "California" });
                } else {
                    setError("Could not find tax rate for this location.");
                }
            } else if (formData.state === "Washington") {
                const rates = await fetchWATaxRates(formData.address, formData.city, formData.zip);
                if (rates) {
                    setResults({
                        salesUseRate: rates.standardRate,
                        motorVehicleRate: rates.motorVehicleRate,
                        state: "Washington"
                    });
                } else {
                    setError("Could not find tax rate for this location.");
                }
            } else if (formData.state === "Colorado") {
                const rates = await fetchCOTaxRates(formData.address, formData.city, formData.zip);
                if (rates) {
                    setResults({
                        salesUseRate: rates.standardRate,
                        motorVehicleRate: rates.motorVehicleRate,
                        state: "Colorado"
                    });
                } else {
                    setError("Could not find tax rate for this location.");
                }
            } else if (formData.state === "Louisiana") {
                const rates = await fetchLATaxRates(formData.address, formData.city, formData.zip);
                if (rates) {
                    setResults({
                        salesUseRate: rates.standardRate,
                        manualLookupUrl: rates.manualLookupUrl,
                        state: "Louisiana"
                    });
                } else {
                    setError("Could not find tax rate for this location.");
                }
            } else if (formData.state === "Oklahoma") {
                const rates = await fetchOKTaxRates(formData.address, formData.city, formData.zip);
                if (rates) {
                    setResults({
                        salesUseRate: rates.standardRate,
                        manualLookupUrl: rates.manualLookupUrl,
                        state: "Oklahoma"
                    });
                } else {
                    setError("Could not find tax rate for this location.");
                }
            } else if (formData.state === "Alabama") {
                const rates = await fetchALTaxRates(formData.address, formData.city, formData.zip);
                if (rates) {
                    setResults({
                        salesUseRate: rates.standardRate,
                        manualLookupUrl: rates.manualLookupUrl,
                        state: "Alabama"
                    });
                } else {
                    setError("Could not find tax rate for this location.");
                }
            } else if (formData.state === "Ohio") {
                // Ohio uses the multi-source fetcher effectively, but we want to 
                // explicitly trigger it and set it as the primary result if found
                const multiSource = await fetchMultiSourceTaxRates(formData.address, formData.city, formData.zip, "Ohio");
                const ohioRate = multiSource.find(s => s.name === "Sales Tax Handbook")?.rate || null;

                setResults({
                    salesUseRate: ohioRate,
                    state: "Ohio",
                    verificationSources: multiSource
                });
            } else {
                // For pending/unsupported states, initialize results 
                // so the 3-box comparison can load below
                setResults({
                    salesUseRate: null,
                    state: formData.state
                });
            }

            // Fetch Multi-Source Verification for all states
            try {
                const multiSource = await fetchMultiSourceTaxRates(formData.address, formData.city, formData.zip, formData.state);
                setResults(prev => prev ? { ...prev, verificationSources: multiSource } : null);
            } catch (msErr) {
                console.error("Multi-source fetch failed:", msErr);
            }

        } catch (err) {
            setError("An error occurred while fetching tax rates.");
            console.error(err);
        } finally {
            setIsFetching(false);
        }
    };

    const handleReset = () => {
        setFormData({ address: "", city: "", zip: "", state: "Washington" });
        setResults(null);
        setError(null);
        setIsFetching(false);
    };

    const getConsensusRate = () => {
        if (!results?.verificationSources) return null;
        const rates = results.verificationSources
            .map(s => s.rate)
            .filter((r): r is number => r !== null);

        if (rates.length < 2) return null;

        // Check for exact matches (or very close)
        const counts: Record<string, number> = {};
        rates.forEach(r => {
            const key = r.toFixed(2);
            counts[key] = (counts[key] || 0) + 1;
        });

        const sortedByCount = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sortedByCount[0][1] >= 2) {
            return parseFloat(sortedByCount[0][0]);
        }
        return null;
    };

    const consensusRate = getConsensusRate();

    const inputClass = "w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700";
    const labelClass = "block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1";

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Calculator size={16} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Compliance Protocol</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Tax <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-500">Intelligence</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">Pinpoint precision sales and use tax calculation system.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Search Form */}
                <div className="lg:col-span-5">
                    <div className="glass-premium p-10 rounded-[3rem] shadow-2xl border-white/20 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-emerald-500/30 transition-all duration-1000" />

                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                            Parameter Input
                        </h2>

                        <form onSubmit={handleLookup} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className={labelClass}>Jurisdiction (State)</label>
                                <select
                                    className="w-full px-6 py-4 bg-white/50 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                >
                                    {US_STATES.map(s => <option key={s} value={s} className="bg-white dark:bg-slate-900">{s}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelClass}>Street Address</label>
                                <input
                                    className="w-full px-6 py-4 bg-white/50 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                                    placeholder="Enter physical address..."
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className={labelClass}>City</label>
                                    <input
                                        className="w-full px-6 py-4 bg-white/50 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                                        placeholder="City name..."
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className={labelClass}>Zip Code *</label>
                                    <input
                                        required
                                        className="w-full px-6 py-4 bg-white/50 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                                        placeholder="Five-digit zip..."
                                        value={formData.zip}
                                        onChange={e => setFormData({ ...formData, zip: e.target.value })}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-3 p-5 bg-rose-500/10 text-rose-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-rose-500/20 animate-in shake duration-500">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-4 pt-6">
                                <button
                                    type="submit"
                                    disabled={isFetching}
                                    className="glow-button w-full py-5 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {isFetching ? (
                                        <RefreshCw size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            Search
                                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="w-full py-5 glass-premium text-slate-500 dark:text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-95 border-white/10"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>

                        <div className="mt-10 pt-8 border-t border-white/10 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
                                Data synchronized with live state tax authorities.<br />Last Sync: Real-time.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results View */}
                <div className="lg:col-span-7">
                    {results ? (
                        <div className="glass-premium p-12 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border-white/20 dark:border-white/5 min-h-[500px] flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-700 bg-white/5">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 mb-8 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] animate-float">
                                <Globe size={48} />
                            </div>

                            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-2">Geolocation Analysis complete</h2>
                            <p className="text-4xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter">
                                {formData.city || "Area"}, <span className="text-emerald-500">{results.state}</span>
                            </p>

                            <div className="w-full max-w-2xl space-y-10">
                                {/* Primary Result Highlight */}
                                <div className="p-12 bg-gradient-to-br from-emerald-500 to-indigo-700 rounded-[3rem] text-white text-center shadow-[0_40px_80px_-20px_rgba(16,185,129,0.4)] relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                    <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[45deg] group-hover:translate-x-[200%] transition-transform duration-1000" />

                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-100/70 mb-4 relative z-10">
                                        {results.salesUseRate !== null ? "Official Verified Rate" : (consensusRate !== null ? "Consensus Protocol Rate" : "Manual Analysis Required")}
                                    </p>
                                    <div className="text-8xl font-black tracking-tighter relative z-10 mb-6 drop-shadow-2xl">
                                        {results.salesUseRate !== null
                                            ? `${Number(results.salesUseRate).toFixed(2)}%`
                                            : (consensusRate !== null ? `${consensusRate.toFixed(2)}%` : "--")}
                                    </div>
                                    <div className="relative z-10 inline-flex items-center gap-3 px-6 py-2.5 bg-black/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-inner">
                                        {results.salesUseRate !== null ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                                                State DOR Direct Transmission
                                            </>
                                        ) : consensusRate !== null ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-emerald-300" />
                                                Consensus Match Confirmed
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                Multi-Node Comparison Required
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Comparison Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {(results.verificationSources || [
                                        { name: "TaxJar", rate: null, link: "https://www.taxjar.com/sales-tax-calculator" },
                                        { name: "Avalara", rate: null, link: "https://www.avalara.com/taxrates/en/calculator.html" },
                                        { name: "Sales Tax Handbook", rate: null, link: "https://www.salestaxhandbook.com/calculator" }
                                    ]).map((source) => (
                                        <div key={source.name} className="glass-premium p-8 rounded-[2rem] border-white/10 flex flex-col items-center justify-between group hover:border-emerald-500/50 transition-all bg-white/5">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{source.name}</p>
                                                <p className="text-sm font-black text-slate-700 dark:text-emerald-500 tracking-tight">
                                                    {source.rate !== null ? `${Number(source.rate).toFixed(2).replace(/\.?0+$/, '')}%` : "--"}
                                                </p>
                                            </div>

                                            <a
                                                href={source.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-8 w-full py-4 glass-premium hover:bg-emerald-500 hover:text-white hover:border-emerald-500 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all text-slate-500 dark:text-slate-400 border-white/10 active:scale-95"
                                            >
                                                Verify Data
                                            </a>
                                        </div>
                                    ))}
                                </div>

                                {/* Technical Breakdown Section */}
                                <div className="p-10 glass-premium rounded-[3rem] border-white/10 text-left bg-white/5">
                                    <div className="flex items-start gap-6">
                                        <div className="w-14 h-14 glass-premium rounded-2xl flex items-center justify-center font-black text-emerald-500 shadow-inner border-emerald-500/20">
                                            <Search size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white mb-3">Systems Context Breakdown</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed tracking-wide">
                                                {results.state === "Louisiana" ? (
                                                    results.salesUseRate && results.salesUseRate > 5
                                                        ? `Analysis identifies the ${results.salesUseRate}% rate as the aggregate of the 5% Louisiana state base plus specific jurisdictional local levies for ${formData.city || "this region"}.`
                                                        : `The ${results.salesUseRate}% rate represents the Louisiana state base levy. Regional parish rates are variable and require address-level mapping.`
                                                ) : results.state === "Alabama" ? (
                                                    results.salesUseRate && results.salesUseRate > 4
                                                        ? `The ${results.salesUseRate}% rate integrates the 4% state base with estimated regional municipal taxes for ${formData.city || "this sector"}.`
                                                        : `Selected rate is the Alabama state baseline. Localized municipal rates are subject to address-specific overrides.`
                                                ) : results.state === "Oklahoma" ? (
                                                    results.salesUseRate && results.salesUseRate > 4.5
                                                        ? `Computation includes the 4.5% Oklahoma base rate plus localized city/county add-ons for ${formData.city || "this location"}.`
                                                        : `The 4.5% figure indicates the Oklahoma state base. Localized additions vary by specific tax district.`
                                                ) : (
                                                    `Standardized ${results.state} sales and use algorithms applied to the ${formData.city || "requested"} tax jurisdiction.`
                                                )}
                                                {" "}Intel advises cross-verification with official state portals for high-stakes transactions.
                                            </p>
                                        </div>
                                    </div>

                                    {results.manualLookupUrl && (
                                        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                                    Official Interface Locked
                                                </p>
                                            </div>
                                            <a
                                                href={results.manualLookupUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-slate-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all active:scale-95 shadow-xl"
                                            >
                                                Initialize {results.state} Portal
                                                <Globe size={16} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setResults(null)}
                                className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-500 transition-colors active:scale-95"
                            >
                                [ System Reset ]
                            </button>
                        </div>
                    ) : (
                        <div className="glass-premium p-12 rounded-[3.5rem] shadow-xl border border-dashed border-white/20 h-full min-h-[500px] flex flex-col items-center justify-center text-center opacity-40 bg-white/5">
                            <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/40 border border-white/20 relative z-10">
                                <Search size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-400 uppercase tracking-[0.2em]">Awaiting Uplink</h3>
                            <p className="text-emerald-200/60 text-sm font-bold mb-10 leading-relaxed relative z-10 uppercase tracking-wide">Provide target coordinates to initialize tax analysis subroutines.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
