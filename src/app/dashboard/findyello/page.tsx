"use client";

import { useState } from "react";
import { Search, Download, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FindYelloPage() {
    const [url, setUrl] = useState("https://www.findyello.com/aruba/restaurants/?sort=alpha");
    const [status, setStatus] = useState("Ready to scrape FindYello listings.");
    const [message, setMessage] = useState("");
    const [isScraping, setIsScraping] = useState(false);

    const handleScrape = async () => {
        setIsScraping(true);
        setStatus("Scraping FindYello, please wait...");
        setMessage("");

        try {
            const response = await fetch("/api/findyello-download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const errorJson = await response.json().catch(() => null);
                const errorText = errorJson?.error || response.statusText || "Scraping failed";
                setStatus("Scraper error");
                setMessage(errorText);
                return;
            }

            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const filename = `findyello_${new Date().toISOString().slice(0,10)}.xlsx`;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(link.href);

            setStatus("Scrape complete and downloaded.");
            setMessage(`${filename} downloaded successfully.`);
        } catch (error: any) {
            setStatus("Scraper failure");
            setMessage(error?.message || "Unable to contact the scraper.");
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-indigo-500">
                    <Search size={24} />
                    <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        FindYello <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Scraper</span>
                    </h1>
                </div>
                <p className="max-w-3xl text-slate-500 dark:text-slate-400 text-base font-medium">
                    Scrape FindYello restaurant or hotel listings directly from RojaDesk and download the results as an Excel file.
                    Enter the FindYello category URL below and click Scrape.
                </p>
            </div>

            <div className="glass-premium rounded-[2.5rem] p-8 border-white/20 dark:border-white/5 space-y-8">
                <div className="grid gap-6 md:grid-cols-[1.5fr_0.9fr]">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">FindYello URL</label>
                        <input
                            value={url}
                            onChange={(event) => setUrl(event.target.value)}
                            className="w-full h-16 px-6 rounded-3xl border border-slate-200 bg-white/80 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Example: <span className="font-semibold">https://www.findyello.com/aruba/restaurants/?sort=alpha</span>
                            or <span className="font-semibold">https://www.findyello.com/aruba/hotels-resorts/?sort=alpha</span>
                        </p>
                    </div>
                    <div className="flex flex-col justify-end gap-4">
                        <button
                            onClick={handleScrape}
                            disabled={isScraping}
                            className={cn(
                                "h-16 rounded-3xl font-black uppercase tracking-[0.2em] text-sm transition-all",
                                isScraping
                                    ? "bg-slate-300 text-slate-700 cursor-not-allowed"
                                    : "bg-gradient-to-r from-indigo-600 to-emerald-500 text-white hover:brightness-110"
                            )}
                        >
                            {isScraping ? (
                                <span className="inline-flex items-center gap-2"><RefreshCw size={18} className="animate-spin" /> Scraping...</span>
                            ) : (
                                <span className="inline-flex items-center gap-2"><Download size={18} /> Scrape FindYello</span>
                            )}
                        </button>
                        <div className="rounded-3xl bg-slate-900/5 p-5 border border-slate-200/70">
                            <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 mb-2">Status</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{status}</p>
                            {message && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {[
                    { title: "Restaurant scraping", description: "Use the Aruba restaurants category URL to capture business name, address and phone.", icon: <CheckCircle2 size={20} className="text-emerald-500" /> },
                    { title: "Hotel scraping", description: "Use the Aruba hotels category URL and download the same Excel output.", icon: <CheckCircle2 size={20} className="text-emerald-500" /> },
                    { title: "No duplicates", description: "The scraper deduplicates by company name, address and phone while collecting results.", icon: <AlertCircle size={20} className="text-indigo-500" /> }
                ].map((item) => (
                    <div key={item.title} className="glass-premium rounded-3xl p-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">{item.icon}</span>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">{item.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
