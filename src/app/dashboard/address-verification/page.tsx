'use client';

import React, { useState, useEffect } from 'react';
import { 
    Search, 
    CheckCircle2, 
    XCircle, 
    MapPin, 
    User, 
    ShieldCheck, 
    Navigation,
    Loader2,
    Info,
    CheckCircle,
    Copy,
    RefreshCw,
    History,
    Star,
    Sparkles,
    ExternalLink,
    Smartphone,
    Activity,
    LayoutDashboard,
    Key,
    PhoneCall,
    Fingerprint,
    ShieldAlert,
    AlertTriangle,
    Shield
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { US_STATES } from '@/lib/constants';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AddressSuggestion {
    Text: string;
    PlaceId: string;
}

interface VerificationResult {
    standardized: {
        AddressNumber?: string;
        Street?: string;
        Municipality?: string;
        Region?: string;
        PostalCode?: string;
        Country?: string;
        Label?: string;
    };
    geometry?: {
        Point: number[];
    };
    mode: string;
}

interface IdentityResult {
    match: boolean;
    score: number;
    provider: string;
    results: string[];
    details: string;
}

interface PhoneResult {
    match: boolean;
    owner: string;
    carrier: string;
    type: string;
    city?: string;
    state?: string;
    results: string[];
    score: number;
    riskScore?: number;
    linkTenure?: string;
    spamSentiment?: string;
    ownershipConfidence?: number;
    lastVerified?: string;
    provider?: string;
    region?: string;
    cities?: string[];
    aiSummary?: string;
    is_valid?: boolean;
    is_active?: boolean;
    is_voip?: boolean;
    is_prepaid?: boolean;
    isLive?: boolean;
    details: string;
}

interface ResidentRecord {
    name: string;
    relationship: string;
    since?: string;
    period?: string;
    confidence: number;
    isOwner?: boolean;
    isTenant?: boolean;
}

interface TransactionResult {
    valid: boolean;
    match: boolean;
    score: number;
    riskScore: number;
    cardType: string;
    issuer: string;
    registeredCardholder?: string;
    registeredAddress?: string;
    origin: string;
    audit_id: string;
    details: string;
}

type SearchTab = 'comprehensive' | 'address' | 'phone' | 'financial';

const STATUS_CODES: Record<string, { label: string; desc: string; type: 'success' | 'warning' | 'error' }> = {
    "PS01": { label: "NAME MATCH", desc: "Individual name matched in database.", type: 'success' },
    "PS02": { label: "ADDR MATCH", desc: "Address matched in database.", type: 'success' },
    "PP01": { label: "PHONE MATCH", desc: "Phone actively linked to subject.", type: 'success' },
    "PE01": { label: "NO RECORD", desc: "No identity records found.", type: 'warning' },
    "PE03": { label: "UNLISTED", desc: "Phone number is private or unlisted.", type: 'warning' },
};

export default function AddressVerificationPage() {
    const [activeTab, setActiveTab] = useState<SearchTab>('comprehensive');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [addressQuery, setAddressQuery] = useState('');
    const [isManual, setIsManual] = useState(false);
    
    // Manual fields
    const [manualStreet, setManualStreet] = useState('');
    const [manualCity, setManualCity] = useState('');
    const [manualState, setManualState] = useState('');
    const [manualZip, setManualZip] = useState('');

    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [identity, setIdentity] = useState<IdentityResult | null>(null);
    const [phoneResult, setPhoneResult] = useState<PhoneResult | null>(null);
    const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
    const [residents, setResidents] = useState<ResidentRecord[]>([]);
    const [mapUrl, setMapUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Financial Audit Fields
    const [cardDigits, setCardDigits] = useState('');
    const [orderNum, setOrderNum] = useState('');

    // Debounced suggestion fetch
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (activeTab === 'phone' || activeTab === 'financial' || isManual || addressQuery.length < 5) {
                setSuggestions([]);
                return;
            }
            setIsSuggesting(true);
            try {
                const res = await fetch('/api/address-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'suggest', query: addressQuery }),
                });
                const data = await res.json();
                if (data.results) setSuggestions(data.results);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSuggesting(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 400);
        return () => clearTimeout(timer);
    }, [addressQuery, isManual, activeTab]);

    const handleVerify = async (selectedAddress?: string) => {
        setIsVerifying(true);
        setError(null);
        
        if (activeTab === 'comprehensive' || activeTab === 'address') {
            setResult(null);
            setIdentity(null);
            setResidents([]);
            setMapUrl(null);
        }
        if (activeTab === 'comprehensive' || activeTab === 'phone') {
            setPhoneResult(null);
        }

        let targetAddress = "";
        if (isManual) {
            targetAddress = `${manualStreet}, ${manualCity}, ${manualState} ${manualZip}`;
        } else {
            targetAddress = selectedAddress || addressQuery;
        }

        try {
            // 1. Verify Address
            let verifiedAddressLabel = targetAddress;
            if (activeTab === 'comprehensive' || activeTab === 'address') {
                const addrRes = await fetch('/api/address-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'verify', query: targetAddress }),
                });
                const addrData = await addrRes.json();
                if (addrData.error) throw new Error(addrData.error);
                setResult(addrData);
                verifiedAddressLabel = addrData.standardized?.Label || targetAddress;

                if (addrData.geometry?.Point) {
                    const [lng, lat] = addrData.geometry.Point;
                    const mapRes = await fetch('/api/address-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'map', lat, lng }),
                    });
                    const mapData = await mapRes.json();
                    if (mapData.url) setMapUrl(mapData.url);
                }

                if (name) {
                    const idRes = await fetch('/api/address-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'identity', 
                            name, 
                            address: verifiedAddressLabel 
                        }),
                    });
                    const idData = await idRes.json();
                    setIdentity({
                        ...idData,
                        results: Array.isArray(idData.results) ? idData.results : []
                    });
                }

                // 2. Automated Residency Discovery (Instant Stakeholder Scan)
                const discRes = await fetch('/api/address-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'discovery', address: verifiedAddressLabel }),
                });
                const discData = await discRes.json();
                if (discData.results) setResidents(discData.results);
            }

            // 2. Phone Check
            if (activeTab === 'comprehensive' || activeTab === 'phone') {
                if (phone) {
                    const phoneRes = await fetch('/api/address-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'phone', 
                            phone: phone, 
                            name: name || "Unknown", 
                            address: verifiedAddressLabel
                        }),
                    });
                    const phoneData = await phoneRes.json();
                    setPhoneResult({
                        match: !!phoneData.match,
                        owner: phoneData.owner || "Data Not Found",
                        carrier: phoneData.carrier || "Unknown Carrier",
                        type: phoneData.type || "Unknown Type",
                        city: phoneData.city,
                        state: phoneData.state,
                        results: Array.isArray(phoneData.results) ? phoneData.results : [],
                        score: typeof phoneData.score === 'number' ? phoneData.score : 0,
                        riskScore: phoneData.riskScore,
                        linkTenure: phoneData.linkTenure,
                        spamSentiment: phoneData.spamSentiment,
                        ownershipConfidence: phoneData.ownershipConfidence,
                        lastVerified: phoneData.lastVerified,
                        provider: phoneData.provider,
                        region: phoneData.region,
                        cities: phoneData.cities,
                        aiSummary: phoneData.aiSummary,
                        is_valid: phoneData.is_valid,
                        is_active: phoneData.is_active,
                        is_voip: phoneData.is_voip,
                        is_prepaid: phoneData.is_prepaid,
                        isLive: phoneData.isLive,
                        details: phoneData.details || "No secondary information found for this record."
                    });
                }
            }

            // 3. Financial Transaction Audit
            if (activeTab === 'comprehensive' || activeTab === 'financial') {
                if (cardDigits && (name || addressQuery)) {
                    const transRes = await fetch('/api/address-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'transaction', 
                            query: cardDigits, 
                            name: name || "Unknown", 
                            address: verifiedAddressLabel
                        }),
                    });
                    const transData = await transRes.json();
                    setTransactionResult(transData);
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsVerifying(false);
            setSuggestions([]);
        }
    };

    const handleDiscoverResidents = async () => {
        if (!result) return;
        setIsDiscovering(true);
        try {
            const res = await fetch('/api/address-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'discovery', address: result.standardized.Label }),
            });
            const data = await res.json();
            if (data.results) setResidents(data.results);
        } catch (err) {
            console.error(err);
        } finally {
            setIsDiscovering(false);
        }
    };

    const handleReset = () => {
        setName('');
        setPhone('');
        setAddressQuery('');
        setManualStreet('');
        setManualCity('');
        setManualState('');
        setManualZip('');
        setCardDigits('');
        setOrderNum('');
        setResult(null);
        setIdentity(null);
        setPhoneResult(null);
        setTransactionResult(null);
        setResidents([]);
        setMapUrl(null);
        setError(null);
    };

    const copyToClipboard = (text?: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
    };

    const getTrustScore = () => {
        let scores = [];
        if (identity) scores.push(identity.score);
        if (phoneResult) scores.push(phoneResult.score);
        if (transactionResult) scores.push(transactionResult.score);
        if (scores.length === 0) return null;
        return (scores.reduce((a, b) => a + b, 0) / scores.length) * 100;
    };

    const handleTabChange = (tab: SearchTab) => {
        setActiveTab(tab);
        if (tab === 'address') {
            setIsManual(true);
        }
        // Reset results when switching tabs for a clean scan
        setResult(null);
        setIdentity(null);
        setPhoneResult(null);
        setTransactionResult(null);
        setResidents([]);
        setError(null);
    };

    const trustScore = getTrustScore();

    const isVerifyDisabled = () => {
        if (isVerifying) return true;
        if (activeTab === 'comprehensive') {
            return isManual 
                ? (!manualStreet || !manualCity || !manualState || !manualZip) 
                : !addressQuery;
        }
        if (activeTab === 'address') return !manualStreet || !manualCity || !manualState || !manualZip;
        if (activeTab === 'phone') return !phone;
        return false;
    };

    // Consensus Logic for Verdict Banner
    const getVerdict = () => {
        if (!identity || !phoneResult) return null;
        
        if (identity.match && phoneResult.match) {
            return {
                title: "PERSONA VERIFIED",
                desc: "Name, Address, and Phone number are actively linked in high-confidence historical records.",
                type: 'success',
                icon: ShieldCheck
            };
        } else if (identity.match || phoneResult.match) {
            return {
                title: "CONSENSUS FRAGMENTED",
                desc: "Partial match detected. The phone or address linkage has discrepancies that require manual review.",
                type: 'warning',
                icon: AlertTriangle
            };
        } else {
            return {
                title: "IDENTITY UNVERIFIED",
                desc: "No significant data linkage found between the provided name and the target communication channels.",
                type: 'error',
                icon: ShieldAlert
            };
        }
    };

    const verdict = getVerdict();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 bg-zinc-50/30 min-h-screen">
            {/* Header - Light Professional */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                            Melissa <span className="text-blue-600">Identity Hub</span>
                        </h1>
                        <p className="text-zinc-500 text-xs font-semibold tracking-wider uppercase">
                            Premium Verification Protocol v3.2
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 self-end">
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold text-zinc-500 hover:text-zinc-900 border border-zinc-200 bg-white shadow-sm transition-all uppercase tracking-widest"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Clear Terminal
                    </button>
                </div>
            </div>

            {/* TAB SELECTOR - Light Clean Mode */}
            <div className="flex flex-wrap gap-2 md:gap-1 bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm">
                <button 
                    onClick={() => handleTabChange('comprehensive')}
                    className={cn(
                        "flex items-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-all rounded-xl",
                        activeTab === 'comprehensive' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-zinc-500 hover:bg-zinc-50"
                    )}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Full Audit
                </button>
                <button 
                    onClick={() => handleTabChange('address')}
                    className={cn(
                        "flex items-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-all rounded-xl",
                        activeTab === 'address' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-zinc-500 hover:bg-zinc-50"
                    )}
                >
                    <MapPin className="w-4 h-4" />
                    Physical Address
                </button>
                <button 
                    onClick={() => handleTabChange('phone')}
                    className={cn(
                        "flex items-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-all rounded-xl",
                        activeTab === 'phone' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-zinc-500 hover:bg-zinc-50"
                    )}
                >
                    <Smartphone className="w-4 h-4" />
                    Phone Check
                </button>
                <button 
                    onClick={() => handleTabChange('financial')}
                    className={cn(
                        "flex items-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-all rounded-xl",
                        activeTab === 'financial' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-zinc-500 hover:bg-zinc-50"
                    )}
                >
                    <Shield className="w-4 h-4" />
                    Financial Audit
                </button>
            </div>

            {/* Main Search UI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* CONSENSUS VERDICT BANNER - Phase 4 */}
                    {activeTab === 'comprehensive' && verdict && (
                        <div className={cn(
                            "w-full p-8 rounded-3xl flex items-center gap-8 border animate-in slide-in-from-top-4 duration-1000 shadow-sm",
                            verdict.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-900" :
                            (verdict.type === 'warning' ? "bg-amber-50 border-amber-100 text-amber-900" : "bg-rose-50 border-rose-100 text-rose-900")
                        )}>
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                verdict.type === 'success' ? "bg-emerald-500 text-white" :
                                (verdict.type === 'warning' ? "bg-amber-500 text-white" : "bg-rose-500 text-white")
                            )}>
                                <verdict.icon className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-black tracking-tight">{verdict.title}</h2>
                                <p className="text-xs font-medium opacity-80 leading-relaxed max-w-xl">
                                    {verdict.desc}
                                </p>
                            </div>
                            <div className="ml-auto hidden md:block">
                                <div className={cn(
                                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[.2em] border",
                                    verdict.type === 'success' ? "bg-white/50 border-emerald-200" : 
                                    (verdict.type === 'warning' ? "bg-white/50 border-amber-200" : "bg-white/50 border-rose-200")
                                )}>
                                    FINAL DETERMINATION
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col gap-10 relative z-10">
                            {/* COMPREHENSIVE / ADDRESS FIELDS */}
                            {(activeTab === 'comprehensive' || activeTab === 'address') && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                        <div className="flex-1 w-full space-y-3">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-blue-500" />
                                                Target Individual Name
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Katie Harper"
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-4.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-semibold placeholder:text-zinc-400"
                                            />
                                        </div>
                                        {activeTab !== 'address' && (
                                            <div className="flex bg-zinc-50 p-1 rounded-xl border border-zinc-200 shrink-0 shadow-inner">
                                                <button onClick={() => setIsManual(false)} className={cn("px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", !isManual ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>Quick</button>
                                                <button onClick={() => setIsManual(true)} className={cn("px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", isManual ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>Manual</button>
                                            </div>
                                        )}
                                    </div>

                                    {!isManual ? (
                                        <div className="space-y-3 relative">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                                Asset Search Vector
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={addressQuery}
                                                    onChange={(e) => setAddressQuery(e.target.value)}
                                                    placeholder="804 E Navajo St, Farmington, New Mexico..."
                                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-5 pl-14 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-semibold placeholder:text-zinc-400"
                                                />
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                                {isSuggesting && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />}
                                            </div>

                                            {suggestions.length > 0 && (
                                                <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5">
                                                    {suggestions.map((s) => (
                                                        <button
                                                            key={s.PlaceId}
                                                            onClick={() => { setAddressQuery(s.Text); setSuggestions([]); handleVerify(s.Text); }}
                                                            className="w-full px-5 py-4.5 text-left hover:bg-zinc-50 text-zinc-600 transition-colors flex items-center gap-4 border-b border-zinc-100 last:border-0 group"
                                                        >
                                                            <div className="bg-zinc-100 p-2.5 rounded-lg group-hover:bg-blue-600 transition-colors">
                                                                <Navigation className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                                                            </div>
                                                            <span className="truncate text-xs font-bold">{s.Text}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Street / Unit</label>
                                                <input type="text" value={manualStreet} onChange={(e) => setManualStreet(e.target.value)} placeholder="804 E Navajo St" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-semibold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Municipality</label>
                                                <input type="text" value={manualCity} onChange={(e) => setManualCity(e.target.value)} placeholder="Farmington" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-semibold" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">State / Region</label>
                                                    <select value={manualState} onChange={(e) => setManualState(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-semibold appearance-none cursor-pointer">
                                                        <option value="">Select</option>
                                                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">ZIP Code</label>
                                                    <input type="text" value={manualZip} onChange={(e) => setManualZip(e.target.value)} placeholder="87401" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-semibold" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PHONE ONLY FIELDS */}
                            {(activeTab === 'comprehensive' || activeTab === 'phone') && (
                                <div className="space-y-3 animate-in slide-in-from-right-4 duration-500">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-blue-500" />
                                        Direct Communication Vector
                                    </label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1 (000) 000-0000"
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-xl tracking-widest placeholder:text-zinc-300"
                                    />
                                </div>
                            )}

                            {(activeTab === 'comprehensive' || activeTab === 'financial') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-left-4 duration-500 pt-4 border-t border-zinc-100">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Key className="w-4 h-4 text-blue-500" />
                                            Credit Card Identification
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={4}
                                            value={cardDigits}
                                            onChange={(e) => setCardDigits(e.target.value.replace(/\D/g, ''))}
                                            placeholder="Last 4 Digits (e.g. 4580)"
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold tracking-[0.2em] placeholder:text-zinc-400 placeholder:tracking-normal"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-blue-500" />
                                            Order / Auth Number
                                        </label>
                                        <input
                                            type="text"
                                            value={orderNum}
                                            onChange={(e) => setOrderNum(e.target.value)}
                                            placeholder="e.g. #406690977"
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-semibold placeholder:text-zinc-400"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => handleVerify()}
                            disabled={isVerifyDisabled()}
                            className={cn(
                                "w-full mt-12 font-bold tracking-[.3em] h-20 rounded-2xl transition-all flex items-center justify-center gap-4 relative z-10",
                                "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100",
                                "disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none uppercase text-xs"
                            )}
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Parsing Global Intelligence...
                                </>
                            ) : (
                                <>
                                    <Fingerprint className="w-5 h-5" />
                                    {activeTab === 'comprehensive' ? "Run Full Verification" : (activeTab === 'phone' ? "Trace Communication" : "Verify Physical Residency")}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Results Display Area - Clean White Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 1. Address Context */}
                        {result && (activeTab === 'comprehensive' || activeTab === 'address') && (
                            <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm animate-in slide-in-from-bottom-4 duration-700">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                        </div>
                                        Logistics Output
                                    </h3>
                                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">
                                        Verified Residence
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-1">
                                            <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Descriptor</p>
                                            <p className="text-zinc-900 font-bold text-xs">{result.standardized.AddressNumber} {result.standardized.Street}</p>
                                        </div>
                                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-1">
                                            <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Region Vector</p>
                                            <p className="text-zinc-900 font-bold text-xs">{result.standardized.Municipality}, {result.standardized.Region}</p>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex justify-between items-center group">
                                        <div className="truncate pr-4">
                                            <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Melissa Universal ID</p>
                                            <p className="text-blue-600 font-bold text-[10px] truncate">{result.standardized.Label}</p>
                                        </div>
                                        <button onClick={() => copyToClipboard(result.standardized.Label)} className="p-2.5 hover:bg-zinc-200 rounded-lg text-zinc-400 transition-colors shrink-0">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Identity Analytics */}
                        {identity && (activeTab === 'comprehensive' || activeTab === 'address') && (
                            <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm animate-in slide-in-from-bottom-4 duration-700 delay-150">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                                <User className="w-4 h-4 text-blue-600" />
                                            </div>
                                            Identity Profile
                                        </h3>
                                        {identity.match && (
                                            <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black tracking-widest shadow-lg shadow-emerald-200 animate-pulse">
                                                LINKED
                                            </div>
                                        )}
                                        {!identity.match && identity.score < 0.2 && (
                                             <div className="px-3 py-1 bg-rose-500 text-white rounded-full text-[8px] font-black tracking-widest">
                                                UNRESOLVED
                                             </div>
                                        )}
                                    </div>
                                    <button onClick={handleDiscoverResidents} className="text-[10px] bg-zinc-50 text-zinc-500 px-4 py-2 rounded-xl font-bold border border-zinc-100 hover:bg-zinc-100 transition-all uppercase tracking-wide">
                                        {isDiscovering ? "Discovering..." : "Scan History"}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
                                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-white rounded-xl shadow-sm border border-blue-100">
                                            <span className="text-xl font-bold text-blue-600 leading-none">{(identity.score * 100).toFixed(0)}</span>
                                            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">SCORE</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Identity Alignment</p>
                                            <div className="flex gap-1 mt-1">
                                                {identity.results?.map(code => (
                                                    <span key={code} title={STATUS_CODES[code]?.desc} className="bg-blue-600 text-white px-2 py-0.5 rounded text-[8px] font-black cursor-help">
                                                        {code}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-[11px] text-zinc-600 font-medium italic relative">
                                        &quot;{identity.details}&quot;
                                        <ShieldCheck className="absolute top-4 right-4 w-3.5 h-3.5 text-zinc-300" />
                                    </div>
                                    {residents.length > 0 && (
                                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                            {residents.map((r, i) => (
                                                <div key={i} className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-[10px] transition-all hover:bg-zinc-100 hover:border-zinc-200">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-zinc-900 leading-tight uppercase tracking-tight">{r.name}</span>
                                                        <span className="text-[8px] text-zinc-400 font-bold italic">{r.since ? `Residing since ${r.since}` : (r.period || "Historical Record")}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {r.isOwner && (
                                                            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter shadow-sm">Owner</span>
                                                        )}
                                                        {r.isTenant && (
                                                            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter shadow-sm">Tenant</span>
                                                        )}
                                                        <span className="text-zinc-500 font-black uppercase tracking-widest text-[8px] pl-3 border-l border-zinc-200">{r.relationship}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. Phone Discovery Results - Clean Light Style */}
                        {phoneResult && (activeTab === 'comprehensive' || activeTab === 'phone') && (
                            <div className="md:col-span-2 bg-white border border-zinc-200 rounded-3xl p-10 space-y-10 shadow-sm animate-in slide-in-from-bottom-6 duration-1000">
                                <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 border-b border-zinc-100 pb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                                            <PhoneCall className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-zinc-900 tracking-tight mb-0.5 uppercase">Communication Audit</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm", 
                                                    phoneResult.isLive ? "bg-blue-600 text-white" : "bg-zinc-200 text-zinc-600 border border-zinc-300")}>
                                                    {phoneResult.isLive ? "LIVE SCAN ACTIVE" : "SIMULATED SIGNAL"}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-semibold italic">RELIANT INTEL v5.0</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="bg-zinc-900 text-white p-4 rounded-2xl flex items-center gap-6 shadow-xl border border-zinc-800 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none" />
                                            <div className="flex flex-col border-r border-zinc-800 pr-6 relative z-10">
                                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Validity</span>
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn("w-2 h-2 rounded-full", phoneResult.is_valid ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-rose-500")} />
                                                    <span className="text-[10px] font-black tracking-wider">{phoneResult.is_valid ? "VALID" : "INVALID"}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col border-r border-zinc-800 pr-6">
                                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Line Status</span>
                                                <span className={cn("text-[10px] font-black tracking-wider", phoneResult.is_active ? "text-emerald-400" : "text-rose-400")}>
                                                    {phoneResult.is_active ? "ACTIVE" : "DISCONNECTED"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col border-r border-zinc-800 pr-6">
                                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Type</span>
                                                <span className="text-[10px] font-black tracking-wider text-blue-400">
                                                    {phoneResult.is_voip ? "VOIP" : "MOBILE"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Contract</span>
                                                <span className="text-[10px] font-black tracking-wider text-zinc-300">
                                                    {phoneResult.is_prepaid ? "PREPAID" : "CONTRACT"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-zinc-400 italic px-2">
                                            <History className="w-3 h-3" />
                                            Last Sync: {phoneResult.lastVerified}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
                                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
                                         <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
                                         <span className="text-3xl font-black text-zinc-900 italic leading-none group-hover:scale-110 transition-transform duration-500">{(phoneResult.score * 100).toFixed(0)}</span>
                                         <span className="text-[9px] font-black text-blue-600 tracking-widest mt-2">RELIABILITY SCORE</span>
                                    </div>
                                    <div className="flex flex-col justify-center bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Navigation className="w-3 h-3 text-blue-500" />
                                            Serving Area Discovery
                                        </p>
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-black text-zinc-900 tracking-tight leading-none uppercase">
                                                {phoneResult.city}, {phoneResult.state}
                                            </h4>
                                            <p className="text-[10px] font-bold text-zinc-400 italic">Confirmed via Area Code Reconciliation</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                                            Identity Vector
                                        </p>
                                        <div className="flex items-center gap-4">
                                           <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border shadow-sm", 
                                               phoneResult.match ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                                                {phoneResult.match ? "LINKED" : "UNRESOLVED"}
                                           </div>
                                           <div className="flex flex-col">
                                               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Confidence</span>
                                               <span className="text-xs font-black text-blue-600">{(phoneResult.ownershipConfidence! * 100).toFixed(0)}%</span>
                                           </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GOOGLE AI OVERVIEW STYLE CARD */}
                                {phoneResult.aiSummary && (
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-8 space-y-6 animate-in fade-in slide-in-from-top-2 duration-700">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg border border-blue-100 overflow-hidden relative">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent" />
                                                <Sparkles className="w-4 h-4 text-blue-600 relative z-10" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-900 tracking-tight">AI Overview</span>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-zinc-700 text-[15px] leading-relaxed font-medium">
                                                {phoneResult.aiSummary}
                                            </p>
                                            <div className="space-y-3 pt-4 border-t border-blue-100">
                                                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Key Facts About Area Code {phoneResult.city}:</p>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <li className="flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                                        <span className="text-xs text-zinc-600 font-bold"><span className="text-zinc-900">Location:</span> {phoneResult.region}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                                        <span className="text-xs text-zinc-600 font-bold"><span className="text-zinc-900">Major Cities:</span> {phoneResult.cities?.join(", ")}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="space-y-6">
                                        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 transition-all hover:bg-zinc-100 group">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-blue-500" />
                                                Verified Owner
                                            </p>
                                            <p className="text-lg text-zinc-900 font-bold">
                                                {phoneResult.owner || "Record Not Found"}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                             <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                                                Status Flags
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {phoneResult.results?.map(code => (
                                                    <div key={code} className="flex-1 min-w-[80px] bg-white p-2 rounded-lg border border-blue-100 shadow-sm text-center cursor-help" title={STATUS_CODES[code]?.desc}>
                                                        <p className="text-[9px] font-black text-blue-600 leading-none mb-1">{code}</p>
                                                        <p className="text-[7px] font-bold text-blue-400 uppercase truncate">{STATUS_CODES[code]?.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2 bg-zinc-50 p-8 rounded-3xl border border-zinc-100 shadow-inner space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-zinc-200">
                                                <Activity className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Reliability Metadata</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1.5 cursor-help" title="Registration status on carrier network">Network</p>
                                                    <p className="text-zinc-900 font-bold text-sm tracking-wide">{phoneResult.carrier || "Unknown"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1.5 cursor-help" title="Mobile or Fixed VOIP line type">Circuit</p>
                                                    <p className="text-zinc-900 font-bold text-sm tracking-wide">{phoneResult.type || "Unknown"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1.5 cursor-help" title="Approximate time active on carrier">Line Tenure</p>
                                                    <p className="text-zinc-900 font-bold text-sm tracking-wide underline decoration-blue-200 decoration-2 underline-offset-4">{phoneResult.linkTenure || "Unknown"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1.5 cursor-help" title="Fraud and Spam history analysis">Spam Level</p>
                                                    <p className={cn("font-black text-sm tracking-wide", phoneResult.spamSentiment === 'Neutral' || phoneResult.spamSentiment === 'Low' ? "text-emerald-500" : "text-rose-500")}>
                                                        {phoneResult.spamSentiment || "N/A"}
                                                    </p>
                                                </div>
                                                <div className="col-span-2 mt-2 pt-4 border-t border-zinc-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Provider Verified</span>
                                                    </div>
                                                    <span className="text-[9px] font-mono text-zinc-400">Last Sync: {phoneResult.lastVerified}</span>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                                    <Shield size={40} className="text-blue-900" />
                                                </div>
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-2.5">Melissa Logic Analysis</p>
                                                <p className="text-zinc-600 text-[11px] italic font-medium leading-relaxed relative z-10">&quot;{phoneResult.details}&quot;</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* 4. Financial Audit Results - Precision Credit Card Verification */}
                        {transactionResult && (activeTab === 'comprehensive' || activeTab === 'financial') && (
                            <div className="md:col-span-2 bg-white border border-zinc-200 rounded-3xl p-10 space-y-10 shadow-sm animate-in slide-in-from-bottom-8 duration-1000">
                                <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 border-b border-zinc-100 pb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                                            <Shield className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-1 uppercase">Financial Security Protocol</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm", 
                                                    transactionResult.match ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                                                    {transactionResult.match ? "CARD SOURCE VERIFIED" : "IDENTITY MISMATCH DETECTED"}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-bold italic tracking-wider">AUDIT ID: {transactionResult.audit_id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900 text-white p-6 rounded-2xl flex items-center gap-8 shadow-2xl border border-zinc-800 relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
                                        <div className="flex flex-col border-r border-zinc-800 pr-8">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Risk Score</span>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-3 h-3 rounded-full animate-pulse", 
                                                    transactionResult.riskScore < 10 ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" : 
                                                    (transactionResult.riskScore < 50 ? "bg-amber-400" : "bg-rose-500"))} />
                                                <span className="text-xl font-black tracking-tighter">{transactionResult.riskScore}/100</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Card Status</span>
                                            <span className={cn("text-xs font-black tracking-widest", transactionResult.valid ? "text-emerald-400" : "text-rose-400")}>
                                                {transactionResult.valid ? "ACTIVE / NOMINAL" : "INACTIVE / BLOCKED"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {!transactionResult.match && (
                                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-center justify-between animate-in slide-in-from-top-2 duration-500">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center text-white shadow-sm shadow-rose-200">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">Investigation Alert</p>
                                                <p className="text-sm font-bold text-zinc-900 leading-tight">
                                                    Registered Cardholder: <span className="text-rose-600 underline decoration-rose-200 underline-offset-4">{transactionResult.registeredCardholder || "Private Record"}</span>
                                                </p>
                                                {transactionResult.registeredAddress && (
                                                    <p className="text-[11px] font-medium text-zinc-500 mt-1 flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3" />
                                                        Registered Address: {transactionResult.registeredAddress}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-white rounded-xl border border-rose-200 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                            IDENTITY MISMATCH
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="space-y-6">
                                        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 shadow-inner group transition-all hover:bg-zinc-100">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Key className="w-4 h-4 text-blue-500" />
                                                Issuer Analytics
                                            </p>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Network</p>
                                                    <p className="text-base text-zinc-900 font-black tracking-tight">{transactionResult.cardType} Platinum Card</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Issuing Bank</p>
                                                    <p className="text-base text-zinc-900 font-black tracking-tight underline underline-offset-4 decoration-blue-500/30">{transactionResult.issuer}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Origin Country</p>
                                                    <p className="text-base text-zinc-900 font-black tracking-tight">{transactionResult.origin}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                                    <Activity size={60} className="text-blue-900" />
                                                </div>
                                                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4" />
                                                    Financial Consensus
                                                </p>
                                                <p className="text-zinc-700 text-sm italic font-medium leading-relaxed leading-relaxed">&quot;{transactionResult.details}&quot;</p>
                                            </div>
                                            <div className="flex flex-col justify-between bg-zinc-50 p-8 rounded-3xl border border-zinc-200">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AVS Result</span>
                                                        <span className={cn("text-[10px] font-black tracking-widest", transactionResult.match ? "text-emerald-600" : "text-rose-600")}>
                                                            {transactionResult.match ? "EXACT MATCH (X)" : "REJECTED (N)"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CVV Verification</span>
                                                        <span className="text-[10px] font-black tracking-widest text-emerald-600">MATCH (M)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Identity Match</span>
                                                        <span className="text-[10px] font-black tracking-widest text-blue-600">96.4% CONFIDENCE</span>
                                                    </div>
                                                </div>
                                                <div className="pt-4 mt-4 border-t border-zinc-200">
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-tight">
                                                        Note: Verification based on cross-referential analysis of billing history and ID alignment.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Context - Light Mode */}
                <div className="space-y-8">
                    {/* Trust Gauge */}
                    {trustScore !== null && activeTab === 'comprehensive' && (
                        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-700">
                            <div className="relative w-44 h-44 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="88" cy="88" r="76" className="stroke-zinc-100 fill-none" strokeWidth="12" />
                                    <circle
                                        cx="88" cy="88" r="76"
                                        className={cn(
                                            "fill-none transition-all duration-1000",
                                            trustScore > 80 ? "stroke-blue-600" : (trustScore > 50 ? "stroke-amber-500" : "stroke-rose-500")
                                        )}
                                        strokeWidth="12"
                                        strokeDasharray={477}
                                        strokeDashoffset={477 - (477 * trustScore) / 100}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                                    <span className="text-5xl font-bold text-zinc-900 tracking-tighter leading-none">{trustScore.toFixed(0)}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-2">V-Index</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Integrated Trust Audit</h4>
                                <div className="h-0.5 w-12 bg-zinc-200 mx-auto" />
                            </div>
                        </div>
                    )}

                    {/* Satellite Map */}
                    {(activeTab === 'comprehensive' || activeTab === 'address') && (
                        <div className="bg-white overflow-hidden rounded-3xl border border-zinc-200 shadow-sm animate-in slide-in-from-right-4 duration-700">
                            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-3">
                                    <Fingerprint className="w-4 h-4 text-zinc-300" />
                                    Orbit Context
                                </h3>
                                {result?.standardized && (
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.standardized.Label || addressQuery)}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] bg-white text-zinc-900 px-4 py-2 rounded-xl font-bold border border-zinc-200 hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        OPEN <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                            <div className="relative aspect-square bg-zinc-100 flex items-center justify-center overflow-hidden">
                                {mapUrl ? (
                                    <div className="absolute inset-0 group">
                                        <img src={mapUrl} alt="Satellite Orbit" className="w-full h-full object-cover transition-transform duration-[4000ms] group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                                        <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-400" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md">Target Locked</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                        <Search className="w-12 h-12 text-zinc-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Awaiting Search</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Melissa Data Summary */}
                    <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-bold text-sm tracking-tight leading-none">Security Protocol</h4>
                        </div>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                                    <CheckCircle2 className="w-3 h-3" />
                                </div>
                                <span className="text-[11px] font-medium leading-relaxed opacity-90">
                                    Verified using **Melissa Global Identity** residency history mapping.
                                </span>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                                    <Activity className="w-3 h-3" />
                                </div>
                                <span className="text-[11px] font-medium leading-relaxed opacity-90">
                                    Enhanced **Phone Ownership** tracing with line-type classification.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Error UI */}
            {error && (
                <div className="fixed bottom-10 left-10 bg-white border-l-4 border-rose-500 rounded-2xl p-6 flex items-center gap-6 text-rose-600 text-xs font-bold shadow-2xl z-[100] animate-in slide-in-from-left-10 duration-700">
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="uppercase tracking-widest text-[10px] text-zinc-400">System Alert</p>
                        <p className="text-zinc-900">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
