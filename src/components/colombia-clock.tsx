"use client";

import { useState, useEffect } from "react";

export function ColombiaClock() {
    const [time, setTime] = useState<string>("");

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat("en-US", {
                timeZone: "America/Bogota",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
            setTime(formatter.format(now) + " COT");
        };

        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!time) return <div className="h-4 w-20 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />;

    return (
        <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
            {time}
        </p>
    );
}
