"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { Building2, Target, Search, Download, Users, ChevronRight, Activity, Filter, MapPin, Globe, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, Check, ExternalLink, Utensils, Coffee, ShoppingBasket, Bed, Wine, ShoppingBag, Pizza, Plane, Landmark, Film, Zap, Fuel, Store } from "lucide-react";
import { BusinessLead, searchBusinessLeads, exportLeadsToExcel } from "@/lib/prospector";
import { US_STATES, NAICS_INDUSTRIES } from "@/lib/dnb-constants";
import { cn } from "@/lib/utils";

// --- Custom Premium Dropdown Component ---
interface CustomDropdownProps {
    options: string[];
    value: string;
    onChange: (val: string) => void;
    label: string;
    icon: React.ReactNode;
}

function CustomDropdown({ options, value, onChange, label, icon }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="space-y-3 relative" ref={containerRef}>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">
                {icon} {label}
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-16 px-6 glass-premium rounded-2xl border-white/20 dark:border-white/5 bg-transparent flex items-center justify-between font-bold text-slate-900 dark:text-white hover:border-indigo-500/50 transition-all outline-none"
            >
                <span className="truncate">{value}</span>
                <ChevronDown size={18} className={cn("text-slate-500 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+12px)] left-0 w-full glass-premium z-[9999] rounded-[2rem] border-white/20 dark:border-white/10 py-3 overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200 bg-white/98 dark:bg-slate-900 border backdrop-blur-3xl">
                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                        {options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full px-6 py-4 flex items-center justify-between text-left font-bold text-sm transition-colors",
                                    value === opt ? "bg-indigo-500/20 text-indigo-500" : "text-slate-700 dark:text-slate-300 hover:bg-white/5"
                                )}
                            >
                                {opt}
                                {value === opt && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
// --- Apple Maps Category Grid Component ---
const APPLE_MAPS_CATEGORIES = [
    { name: 'Restaurants', icon: <Utensils size={18} />, color: 'bg-orange-500' },
    { name: 'Fast Food', icon: <Store size={18} />, color: 'bg-orange-600' },
    { name: 'Gas Stations', icon: <Fuel size={18} />, color: 'bg-blue-500' },
    { name: 'Coffee', icon: <Coffee size={18} />, color: 'bg-orange-400' },
    { name: 'Groceries', icon: <ShoppingBasket size={18} />, color: 'bg-yellow-500' },
    { name: 'Hotels', icon: <Bed size={18} />, color: 'bg-indigo-500' },
    { name: 'Bars', icon: <Wine size={18} />, color: 'bg-orange-500' },
    { name: 'Centers', icon: <ShoppingBag size={18} />, color: 'bg-yellow-600' },
    { name: 'Pizza', icon: <Pizza size={18} />, color: 'bg-orange-500' },
    { name: 'Airports', icon: <Plane size={18} />, color: 'bg-blue-600' },
    { name: 'Banks', icon: <Landmark size={18} />, color: 'bg-slate-500' },
    { name: 'Movies', icon: <Film size={18} />, color: 'bg-rose-500' },
    { name: 'Charging Stations', icon: <Zap size={18} />, color: 'bg-emerald-500' },
];

function AppleMapsCategoryGrid({ selected, onSelect }: { selected: string, onSelect: (name: string) => void }) {
    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-4">Find Nearby</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {APPLE_MAPS_CATEGORIES.map((cat) => (
                    <button
                        key={cat.name}
                        onClick={() => onSelect(cat.name)}
                        className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl glass-premium border border-white/10 transition-all hover:scale-[1.02] active:scale-95 group",
                            selected === cat.name ? "ring-2 ring-indigo-500 shadow-xl" : "hover:border-white/20"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg",
                            cat.color
                        )}>
                            {cat.icon}
                        </div>
                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{cat.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function LeadProspectorPage() {
    const [selectedSource, setSelectedSource] = useState<'Yellow Pages' | 'Yelp' | 'Apple Maps'>('Yellow Pages');
    const [selectedState, setSelectedState] = useState(US_STATES[0]);
    const [selectedIndustry, setSelectedIndustry] = useState(NAICS_INDUSTRIES[0].name);
    const [customIndustry, setCustomIndustry] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [leads, setLeads] = useState<BusinessLead[]>([]);
    const [isSearching, startSearch] = useTransition();
    const [isExporting, setIsExporting] = useState(false);

    const handleSearch = () => {
        const finalIndustry = customIndustry || selectedIndustry;
        startSearch(async () => {
            // If zipCode is provided, we use it for targeting; otherwise we use selectedState
            const results = await searchBusinessLeads(zipCode || selectedState, finalIndustry, selectedSource);
            setLeads(results);
        });
    };

    const handleExport = async () => {
        if (leads.length === 0) return;
        setIsExporting(true);
        try {
            const base64Str = await exportLeadsToExcel(leads);
            const link = document.createElement('a');
            link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Str}`;
            link.download = `Leads_${selectedSource}_${selectedState.replace(/\s/g, '_')}.xlsx`;
            link.click();
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-500">
                        <Target size={20} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Proprietary Data Extraction</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Lead <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Prospector</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-lg max-w-2xl">
                        Autonomous lead discovery via multiple directory sources. Enhanced uniqueness and localized targeting.
                    </p>
                </div>
            </div>

            <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit border border-white/10">
                <button
                    onClick={() => setSelectedSource('Yellow Pages')}
                    className={cn(
                        "px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                        selectedSource === 'Yellow Pages' ? "bg-white dark:bg-slate-800 text-emerald-500 shadow-xl scale-[1.02]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    Yellow Pages
                </button>
                <button
                    onClick={() => setSelectedSource('Yelp')}
                    className={cn(
                        "px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                        selectedSource === 'Yelp' ? "bg-white dark:bg-slate-800 text-rose-500 shadow-xl scale-[1.02]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    Yelp
                </button>
                <button
                    onClick={() => setSelectedSource('Apple Maps')}
                    className={cn(
                        "px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                        selectedSource === 'Apple Maps' ? "bg-white dark:bg-slate-800 text-blue-500 shadow-xl scale-[1.02]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    Apple Maps
                </button>
            </div>

            {/* Controls */}
            <div className="glass-premium rounded-[2.5rem] p-8 border-white/20 dark:border-white/5 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* State Selector / Zip Code Selector */}
                    {selectedSource === 'Apple Maps' ? (
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">
                                <MapPin size={12} /> Zip Code Targeting
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 90210, 10001..."
                                value={zipCode}
                                onChange={(e) => setZipCode(e.target.value)}
                                className="w-full h-16 px-6 glass-premium rounded-2xl border-white/20 dark:border-white/5 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                            />
                        </div>
                    ) : (
                        <CustomDropdown
                            label="Target State"
                            icon={<MapPin size={12} />}
                            options={US_STATES}
                            value={selectedState}
                            onChange={setSelectedState}
                        />
                    )}

                    {/* Industry / Category Search */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">
                            <Filter size={12} /> {selectedSource === 'Yelp' ? 'Yelp Search' : selectedSource === 'Apple Maps' ? 'Apple Maps Search' : 'Category Search'}
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder={selectedSource === 'Apple Maps' ? "Search categories or zip..." : "e.g. Lawn Care, Plumbers..."}
                                value={customIndustry}
                                onChange={(e) => setCustomIndustry(e.target.value)}
                                className="w-full h-16 px-6 glass-premium rounded-2xl border-white/20 dark:border-white/5 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                            />
                            {customIndustry === "" && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-indigo-500/50">
                                    Custom Search
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-end">
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="w-full h-16 glow-button text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {isSearching ? <RefreshCw size={20} className="animate-spin" /> : <Search size={20} />}
                            {isSearching ? "Uploading Directory..." : "Discover Leads"}
                        </button>
                    </div>
                </div>

                {/* Conditional Recommended / Grid */}
                {selectedSource === 'Apple Maps' ? (
                    <AppleMapsCategoryGrid
                        selected={selectedIndustry}
                        onSelect={(name) => {
                            setSelectedIndustry(name);
                            setCustomIndustry("");
                        }}
                    />
                ) : (
                    customIndustry === "" && (
                        <div className="flex flex-wrap gap-3 mt-4">
                            {NAICS_INDUSTRIES.map((ind) => (
                                <button
                                    key={ind.code}
                                    onClick={() => setSelectedIndustry(ind.name)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                                        selectedIndustry === ind.name
                                            ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-500"
                                            : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                                    )}
                                >
                                    {ind.name}
                                </button>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Results */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-1 bg-gradient-to-b from-indigo-500 to-emerald-500 rounded-full" />
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Discovered Prospects</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {leads.length > 0 ? `${leads.length} verified leads found in ${zipCode || selectedState}` : "Ready for extraction"}
                            </p>
                        </div>
                    </div>
                    {leads.length > 0 && (
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="glass-premium px-8 py-3 text-emerald-500 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-emerald-500/10 transition-all border-emerald-500/20"
                        >
                            {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                            Export to Excel
                        </button>
                    )}
                </div>

                <div className="glass-premium rounded-[2.5rem] overflow-hidden border-white/20 dark:border-white/5 min-h-[400px]">
                    {leads.length > 0 ? (
                        <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-6 text-left">Company Name</th>
                                        <th className="px-8 py-6 text-left">Phone</th>
                                        <th className="px-8 py-6 text-left">Location</th>
                                        <th className="px-8 py-6 text-left">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {leads.map((lead, i) => (
                                        <tr key={i} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs",
                                                        lead.source === 'Yelp' ? "bg-rose-500/10 text-rose-500" :
                                                            lead.source === 'Apple Maps' ? "bg-blue-500/10 text-blue-500" :
                                                                "bg-emerald-500/10 text-emerald-500"
                                                    )}>
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{lead.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="font-mono text-xs text-slate-400 font-bold tracking-widest">{lead.phone}</span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-300 tracking-tight">{lead.city}, {lead.state}</span>
                                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">ZIP: {lead.zip}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                {lead.url ? (
                                                    <a
                                                        href={lead.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={cn(
                                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit flex items-center gap-2 hover:scale-105 transition-transform",
                                                            lead.source === 'Yelp' ? "bg-rose-500/5 border-rose-500/20 text-rose-500" :
                                                                "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
                                                        )}
                                                    >
                                                        {lead.source}
                                                        <ExternalLink size={10} />
                                                    </a>
                                                ) : (
                                                    <div className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit",
                                                        lead.source === 'Yelp' ? "bg-rose-500/5 border-rose-500/20 text-rose-500" :
                                                            "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
                                                    )}>
                                                        {lead.source}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 space-y-4">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center text-slate-300 dark:text-white/10 mb-2">
                                <Globe size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">No Leads Extracted</h3>
                            <p className="text-slate-500 font-bold max-w-sm">
                                Configure your targeting parameters above and initialize extraction to begin lead discovery via {selectedSource}.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
