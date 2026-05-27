import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen border-none relative overflow-hidden">
            {/* Background Mesh */}
            <div className="mesh-gradient opacity-20" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

            <Sidebar />
            <main className="flex-1 lg:pl-80 p-4 lg:p-10 relative z-10">
                <div className="max-w-7xl mx-auto space-y-12 pb-20">
                    {children}
                </div>
            </main>
        </div>
    );
}
