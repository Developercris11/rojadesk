"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="p-3 w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />;
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 border border-slate-100 dark:border-slate-700 flex items-center justify-center"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun size={22} className="text-amber-400 animate-in zoom-in spin-in-12 duration-500" />
            ) : (
                <Moon size={22} className="text-indigo-600 animate-in zoom-in duration-500" />
            )}
        </button>
    );
}
