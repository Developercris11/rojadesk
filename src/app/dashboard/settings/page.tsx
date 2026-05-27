"use client";

import { Settings, Shield, Bell, Zap, Globe, Save } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 uppercase">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Settings size={16} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Core Configuration</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-500">Overrides</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-lg normal-case">Calibrate tactical parameters and secure user protocols.</p>
                </div>

                <button className="glow-button px-10 py-5 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-4 active:scale-95 shadow-2xl">
                    <Save size={20} />
                    Commit Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    {/* General Settings */}
                    <div className="glass-premium p-12 rounded-[3.5rem] border-white/20 dark:border-white/5 shadow-2xl bg-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-10 flex items-center gap-4 relative z-10">
                            <Zap className="text-amber-500" size={28} />
                            Performance Uplink
                        </h3>

                        <div className="space-y-10 relative z-10">
                            {[
                                { label: "Quantum Rendering", desc: "Enable next-gen visual acceleration.", checked: true },
                                { label: "Neural Synchronization", desc: "Automatic data mirroring across nodes.", checked: true },
                                { label: "Stealth Mode", desc: "Hide terminal activity from public scans.", checked: false }
                            ].map((opt, i) => (
                                <div key={i} className="flex items-center justify-between p-8 rounded-[2rem] bg-white/40 dark:bg-white/5 border border-white/20 hover:bg-white/60 dark:hover:bg-white/10 transition-all">
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{opt.label}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black tracking-widest mt-1 uppercase">{opt.desc}</p>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only peer" defaultChecked={opt.checked} />
                                        <div className="w-14 h-7 bg-white/20 rounded-full peer peer-checked:bg-emerald-500 transition-all" />
                                        <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full peer-checked:translate-x-7 transition-transform shadow-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Layer */}
                    <div className="glass-premium p-12 rounded-[3.5rem] border-white/20 shadow-2xl bg-white/5 relative overflow-hidden">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-10 flex items-center gap-4">
                            <Shield className="text-emerald-500" size={28} />
                            Security Protocol
                        </h3>
                        <div className="p-10 bg-indigo-500/10 rounded-[2.5rem] border border-indigo-500/20">
                            <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                AES-256 Encryption Active
                            </p>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">System metrics indicate full cryptographic coverage across all jurisdictional databases. No manual override required.</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <div className="glass-premium p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden group bg-white/10">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-[80px]" />
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8"><Globe size={48} className="text-emerald-500" /></div>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Geo-Sync</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Synchronize regional tax logic with international hubs for seamless cross-border analysis.</p>
                        <button className="mt-10 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95">
                            Re-sync All Hubs
                        </button>
                    </div>

                    <div className="p-8 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900 to-black text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40" />
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 relative z-10">Hard Reset</p>
                        <p className="text-xs font-bold uppercase tracking-widest mb-8 text-slate-400 leading-relaxed relative z-10">Emergency system purge. Use only in case of total firewall breach.</p>
                        <button className="w-full py-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-[1.5rem] border border-rose-500/20 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 relative z-10">
                            Purge System Memory
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
