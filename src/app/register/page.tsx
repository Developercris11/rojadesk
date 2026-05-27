"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Lock, User, Phone, UserPlus, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

const TAKEN_USERNAMES = ["csmartinez11", "admin", "tester", "root"];

export default function Register() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const target = e.target as any;

        const username = target.username.value.toLowerCase();
        const password = target.password.value;
        const confirmPassword = target.confirmPassword.value;

        // Check password match
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        // Check username availability
        if (TAKEN_USERNAMES.includes(username)) {
            setError("Username is already taken. Please choose another.");
            return;
        }

        setIsLoading(true);
        // Simulate registration uplink
        setTimeout(() => {
            setIsLoading(false);
            setSuccess(true);
            setTimeout(() => {
                window.location.href = "/";
            }, 2000);
        }, 1500);
    };

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
                <div className="bridge-bg" />
                <div className="bridge-overlay" />
                <div className="w-full max-w-lg relative z-10 text-center animate-in fade-in zoom-in duration-700">
                    <div className="glass-luminous p-16 rounded-[4rem] border-white/40 shadow-2xl">
                        <div className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
                            <CheckCircle2 size={48} className="text-emerald-600 animate-bounce" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Account Created!</h2>
                        <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Redirecting to login portal...</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Cinematic Background Layer */}
            <div className="statue-liberty-bg" />
            <div className="liberty-overlay" />

            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

            <div className="w-full max-w-xl relative z-10 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000">
                <div className="glass-luminous p-10 md:p-14 rounded-[3.5rem] border-white/40 shadow-2xl relative overflow-hidden">
                    {/* Decorative Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-[80px]" />

                    <div className="flex flex-col items-center mb-10 relative z-10 text-center">
                        <div className="w-20 h-20 bg-emerald-600 rounded-[1.8rem] flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20 border border-white/40">
                            <ShieldCheck size={40} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Create <span className="text-emerald-600">Account</span></h1>
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Register new operative</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-in slide-in-from-top-2">
                                <AlertCircle size={18} />
                                <p className="text-xs font-black uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            {/* Email */}
                            <div className="md:col-span-2 group/input">
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-600 transition-colors" size={18} />
                                    <input name="email" type="email" placeholder="email@example.com" className="access-input pl-16 py-4 text-slate-900 border-slate-200 bg-white/50" required />
                                </div>
                            </div>

                            {/* Names Container - Forced stack on mobile via grid-cols-1 */}
                            <div className="group/input">
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">First Name</label>
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-600 transition-colors" size={18} />
                                    <input name="firstName" type="text" placeholder="First Name" className="access-input pl-16 py-4 text-slate-900 border-slate-200 bg-white/50" required />
                                </div>
                            </div>

                            <div className="group/input">
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Last Name</label>
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-600 transition-colors" size={18} />
                                    <input name="lastName" type="text" placeholder="Last Name" className="access-input pl-16 py-4 text-slate-900 border-slate-200 bg-white/50" required />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="group/input">
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-600 transition-colors" size={18} />
                                    <input name="phone" type="tel" placeholder="+1 (555) 000-0000" className="access-input pl-16 py-4 text-slate-900 border-slate-200 bg-white/50" required />
                                </div>
                            </div>

                            {/* Username */}
                            <div className="group/input">
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Desired Username</label>
                                <div className="relative">
                                    <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-600 transition-colors" size={18} />
                                    <input name="username" type="text" placeholder="choose_username" className="access-input pl-16 py-4 text-slate-900 border-slate-200 bg-white/50" required />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="group/input">
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-600 transition-colors" size={18} />
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="access-input pl-16 pr-14 py-4 text-slate-900 border-slate-200 bg-white/50"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Verify Password */}
                            <div className="group/input">
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Verify Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-600 transition-colors" size={18} />
                                    <input
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="access-input pl-16 pr-14 py-4 text-slate-900 border-slate-200 bg-white/50"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            className="glow-button w-full py-5 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl border border-white/10 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:brightness-110 mt-4"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Complete registration
                                    <UserPlus size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center relative z-10">
                        <Link href="/" className="inline-flex items-center gap-3 text-emerald-600 hover:text-emerald-500 transition-all group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest underline underline-offset-4 decoration-emerald-600/30">Back to Login portal</span>
                        </Link>
                    </div>
                </div>

                <p className="mt-8 text-center text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] opacity-80">
                    secure encryption • authorized personal ONLY
                </p>
            </div>
        </main>
    );
}
