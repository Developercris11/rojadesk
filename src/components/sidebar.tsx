"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, BarChart3, Settings, Mail, Users, Bell, Calculator, Target, LogOut, Zap, Map, DollarSign, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./theme-toggle";

const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
    { icon: Building2, label: "Agencies", href: "/dashboard/agencies" },
    { icon: Search, label: "Agency Info Extractor", href: "/dashboard/agency-information" },
    { icon: ShieldCheck, label: "Address & Identity", href: "/dashboard/address-verification" },
    { icon: Target, label: "Lead Prospector", href: "/dashboard/prospector" },
    { icon: Search, label: "FindYello", href: "/dashboard/findyello" },
    { icon: Map, label: "Google Maps Leads", href: "/dashboard/gmaps" },
    { icon: Calculator, label: "Sales Tax Calculator", href: "/dashboard/sales-tax-calculator" },
    { icon: DollarSign, label: "Minnesota Tax Lookup", href: "/dashboard/minnesota-tax" },
    { icon: Users, label: "Teams", href: "/dashboard/teams" },
    { icon: Mail, label: "Send Email", href: "/dashboard/send-email" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden lg:flex w-72 h-[calc(100vh-2rem)] glass-premium m-4 rounded-[2.5rem] p-6 flex-col fixed left-0 top-0 z-50">
            <div className="px-4 py-8 mb-8 flex items-center justify-between">
                <div className="flex flex-col">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">RojaDesk</h2>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mt-1">RojaDesk Prime</span>
                </div>
                <ThemeToggle />
            </div>

            <nav className="flex-1 space-y-2 text-sm font-medium">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                            pathname === item.href
                                ? "text-white glow-button !bg-gradient-to-r !from-emerald-600 !to-indigo-600"
                                : "text-slate-500 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-emerald-500"
                        )}
                    >
                        <item.icon size={22} className={cn(
                            "transition-all duration-500",
                            pathname === item.href ? "scale-110" : "group-hover:scale-110 group-hover:rotate-3"
                        )} />
                        <span className="font-bold tracking-tight text-base">{item.label}</span>
                        {pathname === item.href && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
                        )}
                    </Link>
                ))}
            </nav>

            <div className="mt-auto">
                <div className="p-6 glass-premium rounded-[2rem] border-white/20 dark:border-white/5 bg-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <Bell size={16} className="text-emerald-500" />
                        </div>
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Live Alerts</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-base font-black text-slate-900 dark:text-white leading-tight">2 Check-ins due</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Required Priority</p>
                    </div>
                </div>

                <button
                    onClick={() => window.location.href = "/"}
                    className="mt-6 flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300 group"
                >
                    <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
                    <span className="font-bold tracking-tight text-base">Logout</span>
                </button>
            </div>
        </div>
    );
}
