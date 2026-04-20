'use client';

import { Teacher } from '@/types';
import { useGlobal } from '@/context/GlobalContext';
import TeacherForm from '@/components/forms/TeacherForm';
import SessionManagement from '@/components/SessionManagement';
import { Settings, UserCircle } from 'lucide-react';
import { Loading } from '@/components/ui/Loading';
import { useEffect } from 'react';

import { useParams } from 'next/navigation';

export default function TeacherProfilePage() {
    const { state } = useGlobal();
    const teacherData = state.auth.userProfile as Teacher | null;
    const loading = state.auth.loading;

    // Scroll to section if hash is present
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const elementId = hash.substring(1); // Remove the # symbol
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, []);

    return (
        <div className="flex flex-col w-full gap-6 md:gap-8">
            {/* Profile Section */}
            <div className="bg-linear-to-br from-card via-card/95 to-card/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="bg-linear-to-r from-primary/5 via-primary/10 to-transparent p-6 md:p-8 border-b border-primary/10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                            <div className="relative p-4 bg-linear-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 shadow-lg group">
                                <UserCircle className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                                Account Settings
                            </h2>
                            <p className="text-sm md:text-base text-muted-foreground font-medium mt-1 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Update your personal information and security preferences
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loading size="lg" />
                        </div>
                    ) : teacherData ? (
                        <TeacherForm
                            initialData={teacherData}
                            isProfile={true}
                        />
                    ) : (
                        <div className="py-20 text-center">
                            <div className="text-red-500/10 mb-4">
                                <UserCircle className="w-16 h-16 mx-auto" />
                            </div>
                            <p className="text-red-500 font-semibold">Failed to load teacher profile data</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Session Management */}
            {!loading && teacherData && (
                <div id="sessions">
                    <SessionManagement userId={teacherData.id} />
                </div>
            )}
        </div>
    );
}
