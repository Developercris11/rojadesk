"use client";

import { useState, useEffect } from "react";
import { X, Save, Building2, MapPin, Briefcase } from "lucide-react";
import { US_STATES, CS_REPS, AGENCY_TYPES, TIME_ZONES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
    fetchTaxRate,
    fetchWATaxRates,
    fetchCOTaxRates,
    fetchLATaxRates,
    fetchOKTaxRates,
    fetchALTaxRates,
    fetchMultiSourceTaxRates
} from "@/lib/actions";

interface AddAgencyFormProps {
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any;
}

export function AddAgencyForm({ onClose, onSave, initialData }: AddAgencyFormProps) {
    const [formData, setFormData] = useState(initialData || {
        name: "",
        orgId: "",
        address: "",
        city: "",
        state: "Alabama",
        zip: "",
        country: "United States",
        timeZone: "Eastern Time (US & Canada)",
        csRep: "",
        lastCheckInDate: new Date().toISOString().split('T')[0],
        taxRate: 6.25,
        salesUseTaxRate: 0,
        motorVehicleTaxRate: 0,
        isLargeAccount: false,
        isPrivate: false,
        isNonAgency: false,
        agencyType: "City/Municipality",
        population: "",
        stage: "First Contact"
    });

    const [isFetchingTax, setIsFetchingTax] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    useEffect(() => {
        const fetchRate = async () => {
            if (!formData.zip) return;
            setIsFetchingTax(true);

            try {
                if (formData.state === "California") {
                    const rate = await fetchTaxRate(formData.address, formData.city, formData.zip);
                    if (rate !== null) {
                        setFormData((prev: any) => ({ ...prev, salesUseTaxRate: rate }));
                    }
                } else if (formData.state === "Washington") {
                    const rates = await fetchWATaxRates(formData.address, formData.city, formData.zip);
                    if (rates) {
                        setFormData((prev: any) => ({
                            ...prev,
                            salesUseTaxRate: rates.standardRate,
                            motorVehicleTaxRate: rates.motorVehicleRate
                        }));
                    }
                } else if (formData.state === "Colorado") {
                    const rates = await fetchCOTaxRates(formData.address, formData.city, formData.zip);
                    if (rates) {
                        setFormData((prev: any) => ({
                            ...prev,
                            salesUseTaxRate: rates.standardRate,
                            motorVehicleTaxRate: rates.motorVehicleRate
                        }));
                    }
                } else if (formData.state === "Louisiana") {
                    const rates = await fetchLATaxRates(formData.address, formData.city, formData.zip);
                    if (rates) {
                        setFormData((prev: any) => ({ ...prev, salesUseTaxRate: rates.standardRate }));
                    }
                } else if (formData.state === "Oklahoma") {
                    const rates = await fetchOKTaxRates(formData.address, formData.city, formData.zip);
                    if (rates) {
                        setFormData((prev: any) => ({ ...prev, salesUseTaxRate: rates.standardRate }));
                    }
                } else if (formData.state === "Alabama") {
                    const rates = await fetchALTaxRates(formData.address, formData.city, formData.zip);
                    if (rates) {
                        setFormData((prev: any) => ({ ...prev, salesUseTaxRate: rates.standardRate }));
                    }
                } else if (formData.state === "Ohio") {
                    const multiSource = await fetchMultiSourceTaxRates(formData.address, formData.city, formData.zip, "Ohio");
                    const ohioRate = multiSource.find(s => s.name === "Sales Tax Handbook")?.rate || null;
                    if (ohioRate !== null) {
                        setFormData((prev: any) => ({ ...prev, salesUseTaxRate: ohioRate }));
                    }
                }
            } catch (err) {
                console.error("Error fetching tax rate in form:", err);
            } finally {
                setIsFetchingTax(false);
            }
        };

        const timer = setTimeout(fetchRate, 800); // 800ms debounce
        return () => clearTimeout(timer);
    }, [formData.address, formData.city, formData.zip, formData.state]);

    const inputClass = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm";
    const labelClass = "block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="glass-premium w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 border-white/20 dark:border-white/5 relative bg-white/5">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

                <div className="sticky top-0 z-10 p-10 border-b border-white/10 flex items-center justify-between bg-white/20 dark:bg-slate-900/40 backdrop-blur-2xl">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 border border-white/20 animate-float">
                            <Building2 size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-emerald-500 mb-1">
                                <MapPin size={12} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">Registry Protocol</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                                {initialData ? "Edit Node" : "New Node"}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-all text-slate-400 hover:text-rose-500 active:scale-95 border border-white/10">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-12 relative z-10">
                    {/* Section 1: Agency Identity */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 text-emerald-500">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            <h3 className="font-black uppercase tracking-[0.2em] text-[11px]">Primary Coordinates</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-2">
                                <label className={labelClass}>Agency Identifier (Name) *</label>
                                <input required className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full official jurisdictional name" />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Operational ID (OrgID) *</label>
                                <input required className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400" value={formData.orgId} onChange={e => setFormData({ ...formData, orgId: e.target.value })} placeholder="e.g. OID-7492" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className={labelClass}>Physical Deployment Address</label>
                                <input className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Main street, infrastructure tower..." />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Sector (City)</label>
                                <input className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Jurisdiction (State)</label>
                                <select className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })}>
                                    {US_STATES.map(s => <option key={s} value={s} className="bg-white dark:bg-slate-900">{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Terminal Code (Zip)</label>
                                <input className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white" value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Operations */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 text-emerald-500">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            <h3 className="font-black uppercase tracking-[0.2em] text-[11px]">System Parameters</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className={labelClass}>Assigned CS Node</label>
                                <select className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer" value={formData.csRep} onChange={e => setFormData({ ...formData, csRep: e.target.value })}>
                                    <option value="" className="bg-white dark:bg-slate-900">Unassigned</option>
                                    {CS_REPS.map(r => <option key={r} value={r} className="bg-white dark:bg-slate-900">{r}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Entity Classification</label>
                                <select className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer" value={formData.agencyType} onChange={e => setFormData({ ...formData, agencyType: e.target.value })}>
                                    {AGENCY_TYPES.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-900">{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Temporal Zone</label>
                                <select className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer" value={formData.timeZone} onChange={e => setFormData({ ...formData, timeZone: e.target.value })}>
                                    {TIME_ZONES.map(z => <option key={z} value={z} className="bg-white dark:bg-slate-900">{z}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Last Sync Timestamp</label>
                                <input type="date" className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none" value={formData.lastCheckInDate} onChange={e => setFormData({ ...formData, lastCheckInDate: e.target.value })} />
                            </div>
                            <div className="space-y-2 relative">
                                <label className={labelClass}>Tax Differential (%)</label>
                                <div className="relative">
                                    <input type="number" step="0.01" className={cn("w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white", isFetchingTax && "pr-12 animate-pulse")} value={formData.salesUseTaxRate || ""} onChange={e => setFormData({ ...formData, salesUseTaxRate: parseFloat(e.target.value) || 0 })} placeholder="Calibrating..." />
                                    {isFetchingTax && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-white/20 rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {(formData.state === "Washington" || formData.state === "Colorado") && (
                                <div className="space-y-2 relative">
                                    <label className={labelClass}>Mobile Sector Rate (%)</label>
                                    <div className="relative">
                                        <input type="number" step="0.01" className="w-full px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white" value={formData.motorVehicleTaxRate || ""} onChange={e => setFormData({ ...formData, motorVehicleTaxRate: parseFloat(e.target.value) || 0 })} placeholder="Sector lock..." />
                                    </div>
                                </div>
                            )}

                            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 p-10 bg-white/20 dark:bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                                <label className="flex flex-col gap-4 cursor-pointer group p-6 rounded-[2rem] hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">High Capacity</span>
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only peer" checked={formData.isLargeAccount} onChange={e => setFormData({ ...formData, isLargeAccount: e.target.checked })} />
                                            <div className="w-12 h-6 bg-white/20 rounded-full peer peer-checked:bg-emerald-600 transition-all" />
                                            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-transform shadow-sm" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-slate-700 dark:text-white leading-tight">90d Compliance Cycle</p>
                                </label>

                                <label className="flex flex-col gap-4 cursor-pointer group p-6 rounded-[2rem] hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Encryption</span>
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only peer" checked={formData.isPrivate} onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })} />
                                            <div className="w-12 h-6 bg-white/20 rounded-full peer peer-checked:bg-indigo-600 transition-all" />
                                            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-transform shadow-sm" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-slate-700 dark:text-white leading-tight">Private Protocol</p>
                                </label>

                                <label className="flex flex-col gap-4 cursor-pointer group p-6 rounded-[2rem] hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Standalone</span>
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only peer" checked={formData.isNonAgency} onChange={e => setFormData({ ...formData, isNonAgency: e.target.checked })} />
                                            <div className="w-12 h-6 bg-white/20 rounded-full peer peer-checked:bg-white/40 transition-all" />
                                            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-transform shadow-sm" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-slate-700 dark:text-white leading-tight">Non-Standard Node</p>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-6 pt-6 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-10 py-5 bg-white/10 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/20 transition-all active:scale-95 border border-white/10"
                        >
                            Abort Operations
                        </button>
                        <button
                            type="submit"
                            className="glow-button px-12 py-5 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-4 active:scale-95 shadow-2xl"
                        >
                            <Save size={20} />
                            {initialData ? "Commit Updates" : "Initialize Registry"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
