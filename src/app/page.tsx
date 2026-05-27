"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Lock, LogIn, UserPlus, Info, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Home() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const target = e.target as any;
        const username = target.username.value;
        const password = target.password.value;

        if (username === "csmartinez11" && password === "test10296") {
            setIsLoading(true);
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1000);
        } else {
            setError("Authentication failed. Please verify credentials.");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Cinematic Background Layer */}
            <div
                className="bridge-bg"
                style={{ backgroundImage: "url('/brooklyn_bridge.png')" }}
            />
            <div className="bridge-overlay" />

            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000">
                <div className="glass-luminous p-12 md:p-14 rounded-[3.5rem] border-white/40 shadow-2xl relative overflow-hidden group">
                    {/* Decorative Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-[80px]" />

                    <div className="flex flex-col items-center mb-8 relative z-10 text-center">
                        <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20 border border-white/40 animate-soft-float">
                            <ShieldCheck size={40} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Roja<span className="text-emerald-600">Desk</span></h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-in slide-in-from-top-2">
                                <AlertCircle size={18} />
                                <p className="text-xs font-black uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group/input">
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Username</label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-600 transition-colors" size={18} />
                                    <input
                                        name="username"
                                        type="text"
                                        placeholder="Enter your username..."
                                        className="access-input pl-16 py-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600/50 focus:ring-emerald-600/10 border-slate-200 bg-white/50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="relative group/input">
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-600 transition-colors" size={18} />
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        className="access-input pl-16 py-4 pr-16 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600/50 focus:ring-emerald-600/10 border-slate-200 bg-white/50"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            className="glow-button w-full py-5 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl border border-white/10 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:brightness-110"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Login
                                    <LogIn size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 space-y-8 text-center relative z-10 border-t border-white/5 pt-10">
                        <div className="space-y-6">
                            <p className="text-sm font-bold text-slate-300 tracking-wide">
                                Don't have access?
                            </p>
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-3 px-10 py-4 glass-premium hover:bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-white/20 active:scale-95 shadow-xl"
                            >
                                <UserPlus size={16} className="text-emerald-400" />
                                Register here
                            </Link>
                        </div>

                        <div className="pt-6">
                            <button className="flex items-center gap-3 mx-auto text-emerald-500 hover:text-emerald-400 transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                                    <Info size={14} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest underline underline-offset-4 decoration-emerald-500/30">Forgot your password?</span>
                            </button>
                        </div>
                    </div>
                </div>

                <p className="mt-10 text-center text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] opacity-80">
                    secure encryption • authorized personal ONLY
                </p>
            </div>
        </main>
    );
}
