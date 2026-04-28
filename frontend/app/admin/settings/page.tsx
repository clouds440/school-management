'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Settings, Shield } from 'lucide-react';
import { Role } from '@/types';
import SessionManagement from '@/components/SessionManagement';
import { Loading } from '@/components/ui/Loading';

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Scroll to section if hash is present
    useEffect(() => {
        const hash = window.location.hash;
        if (hash === '#sessions') {
            const element = document.getElementById('sessions');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, []);

    // Redirect non-admin users
    if (user && user.role !== Role.SUPER_ADMIN && user.role !== Role.PLATFORM_ADMIN) {
        router.push('/');
        return null;
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loading size="md" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col max-w-7xl mx-auto w-full">
            <div className="mb-6 md:mb-8">
                <div className="mt-2 flex items-center gap-4 md:gap-6">
                    <div className="relative p-3 md:p-4 bg-linear-to-br from-primary/10 to-primary/5 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-xl">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <Settings className="w-8 h-8 md:w-10 md:h-10 text-primary relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">Admin Settings</h1>
                        <p className="text-muted-foreground font-semibold opacity-70 mt-1 tracking-wider text-xs md:text-sm">Platform Administration & Security</p>
                    </div>
                </div>
            </div>

            <div className="bg-linear-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-6 md:p-10 mb-10 text-card-foreground">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-black text-foreground">Device Session Management</h2>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium opacity-70">Manage active login sessions across all devices</p>
                    </div>
                </div>

                <div id="sessions">
                    <SessionManagement userId={user.id} />
                </div>
            </div>
        </div>
    );
}
