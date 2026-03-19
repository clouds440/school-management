'use client';

import { usePathname } from 'next/navigation';

export default function DashboardMainWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/admin/') || 
                       pathname?.split('/').length > 2;

    return (
        <main className={`grow relative z-10 w-full flex flex-col pt-16 h-screen ${isDashboard ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <div className="grow flex flex-col min-h-0">
                {children}
            </div>
        </main>
    );
}
