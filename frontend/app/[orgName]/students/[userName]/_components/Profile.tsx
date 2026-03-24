'use client';

import { Student } from '@/types';
import StudentForm from '@/components/forms/StudentForm';
import { Settings } from 'lucide-react';

export default function Profile({ profile, orgSlug }: { profile: Student | null; orgSlug: string }) {
    return (
        <div className="bg-card rounded-sm border border-white/5 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="p-8 border-b border-primary/10 bg-primary/5 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-sm">
                    <Settings className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-card-text">Account Settings</h2>
                    <p className="text-xs font-bold text-card-text/40 uppercase tracking-widest mt-1">
                        Update your personal information and student record details
                    </p>
                </div>
            </div>

            <div className="p-8">
                {profile ? (
                    <StudentForm
                        orgSlug={orgSlug}
                        initialData={profile}
                        isProfile={true}
                    />
                ) : (
                    <div className="py-20 text-center text-card-text/60 font-bold uppercase tracking-widest">
                        Failed to load profile data
                    </div>
                )}
            </div>
        </div>
    );
}
