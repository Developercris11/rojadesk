"use client";

import { useState } from "react";
import { Mail, AlertCircle, CheckCircle2, Building2, Send, RefreshCw } from "lucide-react";
import { mockAgencies } from "@/lib/mock-data";
import { isCheckInDue, formatDate } from "@/lib/utils";
import { sendCheckInReminders } from "@/lib/actions";
import { cn } from "@/lib/utils";

export default function SendEmailPage() {
    const dueAgencies = mockAgencies.filter(a => isCheckInDue(a.lastCheckInDate, a.accountType));
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

    const handleSend = async () => {
        setSending(true);
        setStatus(null);
        try {
            const res = await sendCheckInReminders(mockAgencies);
            setStatus(res);
        } catch (err: any) {
            setStatus({ success: false, message: err.message });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                    <Send size={16} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Communication Uplink</span>
                </div>
                <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    Email <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-600">Digest</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">Dispatch summarized intelligence overrides to administrative hubs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                    <div className="glass-premium rounded-[3rem] p-10 border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black flex items-center gap-4 tracking-tight">
                                <AlertCircle className="text-rose-500" size={28} />
                                Overdue Protocol ({dueAgencies.length})
                            </h3>
                        </div>

                        <div className="space-y-5 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                            {dueAgencies.length > 0 ? (
                                dueAgencies.map((agency) => (
                                    <div key={agency.id} className="group flex items-center gap-5 p-5 rounded-[1.5rem] bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/5 transition-all hover:bg-white/60 dark:hover:bg-white/10 hover:translate-x-2">
                                        <div className="w-14 h-14 glass-premium rounded-2xl flex items-center justify-center font-black text-emerald-500 shadow-inner border-white/40">
                                            {agency.name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 dark:text-white tracking-tight uppercase text-base">{agency.name}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                                Last Sync: {formatDate(agency.lastCheckInDate)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-4 py-1.5 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest ring-1 ring-rose-500/20 shadow-sm shadow-rose-500/5">
                                                Critical
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white/20 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/20">
                                    <CheckCircle2 className="mx-auto text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" size={64} />
                                    <p className="text-slate-500 dark:text-slate-300 font-black text-xl uppercase tracking-widest">All Nodes Synced</p>
                                    <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-wide">No dispatch required at this time.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                    <div className="glass-premium rounded-[3rem] p-10 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-emerald-500/30 transition-all duration-1000" />

                        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/40 border border-white/20 relative z-10">
                            <Mail size={40} className="group-hover:scale-110 transition-transform" />
                        </div>

                        <h3 className="text-3xl font-black mb-4 leading-tight tracking-tight relative z-10">Strategic Dispatcher</h3>
                        <p className="text-emerald-200/60 text-sm font-bold mb-10 leading-relaxed relative z-10 uppercase tracking-wide">
                            Initialize full system audit and transmit overrides to designated administrative coordinates.
                        </p>

                        <button
                            onClick={handleSend}
                            disabled={sending || dueAgencies.length === 0}
                            className={cn(
                                "glow-button w-full py-6 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-4 relative z-10 active:scale-95",
                                dueAgencies.length > 0
                                    ? "text-white opacity-100"
                                    : "opacity-40 grayscale cursor-not-allowed shadow-none"
                            )}
                        >
                            {sending ? (
                                <RefreshCw className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <Send size={20} />
                                    Execute Dispatch
                                </>
                            )}
                        </button>

                        {status && (
                            <div className={cn(
                                "mt-8 p-6 rounded-[1.5rem] animate-in slide-in-from-top-4 duration-500 border backdrop-blur-2xl text-center relative z-10",
                                status.success
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                            )}>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className={cn("w-2 h-2 rounded-full", status.success ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        {status.success ? "Transmission Successful" : "Uplink Error"}
                                    </p>
                                </div>
                                <p className="text-xs font-bold leading-relaxed">{status.message || (status.success ? "Digest transmitted to HQ." : "Liaison communication failed.")}</p>
                            </div>
                        )}
                    </div>

                    <div className="glass-premium rounded-[2rem] p-8 text-center border-white/10 bg-white/5 group hover:bg-white/10 transition-colors">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Administrative Hub</p>
                        <p className="text-sm font-black text-slate-700 dark:text-emerald-400 tracking-tight">developercris11@gmail.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
