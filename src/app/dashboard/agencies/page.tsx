"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Search, Filter, AlertCircle, CheckCircle2, Globe, Pencil, Trash2, Mail, Zap } from "lucide-react";
import Link from "next/link";
import { mockAgencies, type Agency } from "@/lib/mock-data";
import { formatDate, isCheckInDue, getNextCheckInDate, cn } from "@/lib/utils";
import { AddAgencyForm } from "@/components/add-agency-form";
import { useSearchParams } from "next/navigation";
import { sendCheckInReminders, sendSingleCheckInReminder } from "@/lib/actions";
import { Suspense } from "react";

function AgenciesContent() {
    const [agencies, setAgencies] = useState<Agency[]>(mockAgencies);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [agencyToEdit, setAgencyToEdit] = useState<Agency | null>(null);
    const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);
    const [showOnlyDue, setShowOnlyDue] = useState(false);
    const [dueCount, setDueCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    const searchParams = useSearchParams();
    const filterParam = searchParams.get('filter');

    useEffect(() => {
        setMounted(true);
        setDueCount(agencies.filter(a => isCheckInDue(a.lastCheckInDate, a.accountType)).length);
    }, [agencies]);

    useEffect(() => {
        if (filterParam === 'due') {
            setShowOnlyDue(true);
        }
    }, [filterParam]);

    const filteredAgencies = agencies.filter(agency => {
        const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agency.orgId.toLowerCase().includes(searchTerm.toLowerCase());

        if (showOnlyDue) {
            return matchesSearch && isCheckInDue(agency.lastCheckInDate, agency.accountType);
        }

        return matchesSearch;
    });

    const handleSaveAgency = (data: any) => {
        const lastDate = new Date(data.lastCheckInDate || new Date());

        if (agencyToEdit) {
            // Update existing
            const updated = agencies.map(a => a.id === agencyToEdit.id ? {
                ...a,
                name: data.name,
                orgId: data.orgId,
                region: data.state,
                address: data.address,
                city: data.city,
                zip: data.zip,
                accountType: (data.isLargeAccount ? 'LARGE' : 'REGULAR') as 'LARGE' | 'REGULAR',
                lastCheckInDate: lastDate.toISOString().split('T')[0],
                taxRate: data.taxRate,
                salesUseTaxRate: data.salesUseTaxRate,
                motorVehicleTaxRate: data.motorVehicleTaxRate,
                assignedRep: data.csRep
            } : a);
            setAgencies(updated);
            setAgencyToEdit(null);
        } else {
            // Add new
            const newAgency: Agency = {
                id: Math.random().toString(36).substr(2, 9),
                name: data.name,
                orgId: data.orgId || ("ROJA-" + Math.floor(100 + Math.random() * 900)),
                region: data.state,
                address: data.address,
                city: data.city,
                zip: data.zip,
                accountType: (data.isLargeAccount ? 'LARGE' : 'REGULAR') as 'LARGE' | 'REGULAR',
                lastCheckInDate: lastDate.toISOString().split('T')[0],
                taxRate: data.taxRate || 6.25,
                salesUseTaxRate: data.salesUseTaxRate || 0,
                motorVehicleTaxRate: data.motorVehicleTaxRate || 0,
                assignedRep: data.csRep || "Unassigned"
            };
            setAgencies([newAgency, ...agencies]);
        }

        // Automatic email if overdue
        const isDueAtSave = isCheckInDue(lastDate.toISOString().split('T')[0], (data.isLargeAccount ? 'LARGE' : 'REGULAR'));
        if (isDueAtSave) {
            const savedAgency = agencyToEdit ? { ...agencyToEdit, lastCheckInDate: lastDate.toISOString().split('T')[0] } : null; // Close enough for the summary
            // For new agencies, we'd need the full object, but since we're using mock state, we can just send it manually or use the data provided
            sendSingleCheckInReminder({
                id: agencyToEdit?.id || "NEW",
                name: data.name,
                orgId: data.orgId || "ROJA-NEW",
                region: data.state,
                accountType: data.isLargeAccount ? 'LARGE' : 'REGULAR',
                lastCheckInDate: lastDate.toISOString().split('T')[0],
                taxRate: data.taxRate || 6.25,
                assignedRep: data.csRep || "Unassigned",
                address: data.address,
                city: data.city,
                zip: data.zip
            });
        }

        setIsModalOpen(false);
    };

    const handleDeleteAgency = () => {
        if (agencyToDelete) {
            setAgencies(agencies.filter(a => a.id !== agencyToDelete.id));
            setAgencyToDelete(null);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Building2 size={16} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Agency Intelligence</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Agency <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-500">Management</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">Central control for all account relationships and compliance.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="glow-button px-10 py-5 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 active:scale-95 transition-all"
                >
                    <Plus size={22} />
                    Deploy New Agency
                </button>
            </div>

            {
                isModalOpen && (
                    <AddAgencyForm
                        onClose={() => {
                            setIsModalOpen(false);
                            setAgencyToEdit(null);
                        }}
                        onSave={handleSaveAgency}
                        initialData={agencyToEdit ? {
                            ...agencyToEdit,
                            state: agencyToEdit.region,
                            isLargeAccount: agencyToEdit.accountType === 'LARGE',
                        } : null}
                    />
                )
            }

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex items-center gap-6 glass-premium p-8 rounded-[2rem] border-white/20 dark:border-white/5">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Assets</p>
                        <p className="text-4xl font-black tracking-tight">{agencies.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 glass-premium p-8 rounded-[2rem] border-rose-500/10">
                    <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Action Required</p>
                        <p className="text-4xl font-black tracking-tight text-rose-500">{dueCount}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 glass-premium p-8 rounded-[2rem] border-emerald-500/10">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Status Check</p>
                        <p className="text-4xl font-black tracking-tight text-emerald-500">Online</p>
                    </div>
                </div>
            </div>

            <div className="glass-premium rounded-[2.5rem] overflow-hidden border-white/20 dark:border-white/5 shadow-2xl">
                <div className="p-8 border-b border-white/10 flex flex-col md:flex-row md:items-center gap-6 bg-white/5">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Scan Agency Database..."
                            className="w-full pl-16 pr-6 py-4 bg-white/50 dark:bg-white/5 border border-white/20 rounded-[1.5rem] focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowOnlyDue(!showOnlyDue)}
                        className={cn(
                            "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all duration-300",
                            showOnlyDue
                                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                                : "glass-premium hover:bg-white/20 text-slate-600 dark:text-slate-400"
                        )}
                    >
                        <AlertCircle size={18} />
                        {showOnlyDue ? "Viewing Due" : "Show Due"}
                    </button>
                    <button className="flex items-center gap-3 px-8 py-4 glass-premium hover:bg-white/20 rounded-[1.5rem] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-xs transition-all">
                        <Filter size={18} />
                        Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/10 dark:bg-black/20 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <th className="px-8 py-6">Agency Intelligence</th>
                                <th className="px-8 py-6">Coordinates</th>
                                <th className="px-8 py-6">Classification</th>
                                <th className="px-8 py-6">Last Sync</th>
                                <th className="px-8 py-6">Next Review</th>
                                <th className="px-4 py-6 text-center">Base Tax</th>
                                <th className="px-4 py-6 text-center">S&U Tax</th>
                                <th className="px-4 py-6 text-center">MV Tax</th>
                                <th className="px-8 py-6 text-right">System Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredAgencies.map((agency) => {
                                const due = mounted && isCheckInDue(agency.lastCheckInDate, agency.accountType);
                                return (
                                    <tr key={agency.id} className="group border-b border-white/5 hover:bg-white/5 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 glass-premium rounded-xl flex items-center justify-center font-black text-emerald-500 border-white/20">
                                                    {agency.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase tracking-tight text-base"> {agency.name}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">Operative: {agency.assignedRep || "Unassigned"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-700 dark:text-slate-300">{agency.region}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">{agency.orgId}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1",
                                                agency.accountType === 'LARGE'
                                                    ? "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20"
                                                    : "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
                                            )}>
                                                {agency.accountType}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                {mounted && (due ? (
                                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                ))}
                                                <span className={cn(
                                                    "font-black text-sm tracking-tight",
                                                    mounted && due ? "text-rose-500" : "text-slate-600 dark:text-slate-300"
                                                )}>
                                                    {formatDate(agency.lastCheckInDate)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                                                {formatDate(getNextCheckInDate(agency.lastCheckInDate, agency.accountType))}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">
                                                Manual Review
                                            </p>
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 glass-premium text-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest border-indigo-500/20">
                                                {agency.taxRate}%
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ring-1",
                                                    agency.salesUseTaxRate && agency.salesUseTaxRate !== agency.taxRate
                                                        ? "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20"
                                                        : "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
                                                )}>
                                                    {agency.salesUseTaxRate || "0"}%
                                                </div>
                                                {agency.region === "California" && (
                                                    <a
                                                        href={`https://services.maps.cdtfa.ca.gov/api/taxrate/GetRateByAddress?address=${(agency.address || "").replace(/\s+/g, '+')}&city=${(agency.city || "").replace(/\s+/g, '+')}&zip=${agency.zip || ""}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                                                    >
                                                        <Globe size={12} />
                                                        CDTFA
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 glass-premium text-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest border-indigo-500/10">
                                                {agency.motorVehicleTaxRate || "0"}%
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {due && (
                                                    <button
                                                        onClick={async () => {
                                                            const res = await sendSingleCheckInReminder(agency);
                                                            if (res.success) alert(`Notification sent for ${agency.name}`);
                                                            else alert(`Error: ${res.message}`);
                                                        }}
                                                        className="p-3 glass-premium rounded-xl text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all active:scale-90"
                                                        title="Deploy Reminder"
                                                    >
                                                        <Mail size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setAgencyToEdit(agency);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-3 glass-premium rounded-xl text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all active:scale-90"
                                                    title="Modify Data"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setAgencyToDelete(agency)}
                                                    className="p-3 glass-premium rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-all active:scale-90"
                                                    title="Terminate"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredAgencies.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="bg-slate-50 dark:bg-slate-900/50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Search size={40} />
                            </div>
                            <p className="text-slate-500 font-bold">No agencies found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {
                agencyToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[20px] animate-in fade-in duration-500">
                        <div className="glass-premium max-w-md w-full p-10 rounded-[3rem] shadow-2xl border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-8 mx-auto">
                                <AlertCircle size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 text-center tracking-tighter">Terminate Connection?</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 text-center leading-relaxed">
                                Are you sure you want to delete <span className="text-rose-500 font-black">{agencyToDelete.name}</span>? This command is permanent and will wipe all associated intel.
                            </p>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleDeleteAgency}
                                    className="w-full py-5 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/30 active:scale-95"
                                >
                                    Confirm Termination
                                </button>
                                <button
                                    onClick={() => setAgencyToDelete(null)}
                                    className="w-full py-5 glass-premium text-slate-500 dark:text-slate-400 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-white/10 dark:hover:bg-white/5 transition-all active:scale-95"
                                >
                                    Abort Mission
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default function AgenciesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AgenciesContent />
        </Suspense>
    );
}
