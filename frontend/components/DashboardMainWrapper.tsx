'use client';

export default function DashboardMainWrapper({ children }: { children: React.ReactNode }) {

    return (
        <main className={`grow relative z-10 w-full flex flex-col pt-16 h-screen overflow-hidden`}>
            <div className="grow flex flex-col min-h-0">
                {children}
            </div>
        </main>
    );
}
