import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | null) {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function isCheckInDue(lastCheckIn: string | null, accountType: 'LARGE' | 'REGULAR') {
    if (!lastCheckIn) return true;

    const lastDate = new Date(lastCheckIn);
    const today = new Date();
    const diffDays = Math.ceil((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    const cycle = accountType === 'LARGE' ? 90 : 180;
    return diffDays >= cycle;
}

export function getNextCheckInDate(lastDate: string | null, accountType: 'LARGE' | 'REGULAR'): string {
    if (!lastDate) return "N/A";
    const date = new Date(lastDate);
    const cycleDays = accountType === 'LARGE' ? 90 : 180;
    date.setDate(date.getDate() + cycleDays);
    return date.toISOString().split('T')[0];
}
