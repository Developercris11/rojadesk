import { AlertCircle, Building2, Calendar, TrendingUp, Info, ArrowUpRight, Activity, Clock } from "lucide-react";
import Link from "next/link";
import { ColombiaClock } from "@/components/colombia-clock";

export default function DashboardPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Greeting Header */}
            <div className="flex items-end justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Activity size={16} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Online</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-500">Overview</span>
                    </h1>
                    {/* Removed greeting message as requested */}
                </div>

                <div className="hidden lg:flex items-center gap-4 p-2 glass-premium rounded-2xl">
                    <div className="px-4 py-2 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
                        <p className="text-[10px] font-black uppercase text-slate-400">Colombia Time</p>
                        <ColombiaClock />
                    </div>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Stats Cards - Large Impact */}
                {[
                    { label: "Agencies", value: "24", icon: Building2, color: "emerald", href: "/dashboard/agencies", trend: "+2 this month" },
                    { label: "Due Soon", value: "05", icon: AlertCircle, color: "indigo", href: "/dashboard/agencies?filter=due", trend: "High Priority" },
                    { label: "Growth", value: "12.5%", icon: TrendingUp, color: "emerald", href: "#", trend: "Steadily rising" },
                    { label: "Reviews", value: "08", icon: Calendar, color: "indigo", href: "#", trend: "Next 7 days" },
                ].map((stat, i) => (
                    <Link key={i} href={stat.href} className="group bento-card flex flex-col justify-between min-h-[220px]">
                        <div className="flex justify-between items-start">
                            <div className={`p-4 rounded-2xl bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/10 border border-${stat.color}-500/20 text-${stat.color}-500`}>
                                <stat.icon size={28} />
                            </div>
                            <ArrowUpRight size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                            <h3 className="text-5xl font-black tracking-tighter mb-2">{stat.value}</h3>
                            <p className={`text-[10px] font-bold text-${stat.color}-500 uppercase tracking-tighter`}>{stat.trend}</p>
                        </div>
                    </Link>
                ))}

                {/* Main Activity Feed - Triple Wide Column */}
                <div className="lg:col-span-3 bento-card">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            <h3 className="text-2xl font-black tracking-tight">Recent Intelligence</h3>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:underline">View All History</button>
                    </div>

                    <div className="space-y-6">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-start gap-6 p-6 rounded-[1.5rem] bg-white/5 dark:bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group/item">
                                <div className="p-3 glass-premium rounded-xl text-emerald-500">
                                    <Clock size={20} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-lg font-bold text-slate-900 dark:text-white group-hover/item:text-emerald-500 transition-colors">
                                        System-detected check-in for <span className="underline decoration-emerald-500/30">Blue Star Media</span>
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase tracking-widest">
                                        <span>Automated Alert</span>
                                        <span className="w-1 h-1 bg-slate-400 rounded-full" />
                                        <span>2 hours ago</span>
                                    </div>
                                </div>
                                <button className="self-center p-3 opacity-0 group-hover/item:opacity-100 glass-premium rounded-xl transition-all">
                                    <ArrowUpRight size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Tip - Integrated Style */}
                <div className="bento-card bg-gradient-to-br from-indigo-600 to-emerald-600 text-white border-none shadow-2xl shadow-emerald-500/20 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 glass-premium rounded-2xl flex items-center justify-center mb-6 border-white/20">
                            <Info size={24} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 tracking-tighter leading-tight">Pro Efficiency Tips</h3>
                        <p className="text-emerald-100/80 text-sm font-bold leading-relaxed">
                            Large accounts should be prioritized every 90 days for maximum retention.
                        </p>
                    </div>

                    <div className="mt-8 p-6 glass-premium rounded-2xl border-white/10 bg-white/10 backdrop-blur-md">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60 text-white">Insight</p>
                        <p className="text-xs font-bold leading-relaxed text-emerald-50">
                            Automated email sequences increase response rates by 42%.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
