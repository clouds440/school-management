'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Teacher } from '@/types';
import TeacherForm from '@/components/forms/TeacherForm';
import { Settings, UserCircle } from 'lucide-react';

import { useParams } from 'next/navigation';

export default function TeacherProfilePage() {
    const params = useParams();
    const orgName = (params?.orgName as string) || '';
    const { token } = useAuth();
    const [teacherData, setTeacherData] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        api.org.getProfile(token)
            .then(setTeacherData)
            .catch(err => console.error('Failed to fetch profile:', err))
            .finally(() => setLoading(false));
    }, [token]);

    return (
        <div className="flex flex-col w-full animate-fade-in-up">
            <div className="bg-card rounded-sm border border-white/40 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-primary/10 bg-primary/5 flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-sm shadow-inner group">
                        <UserCircle className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-card-text underline decoration-primary/30 underline-offset-8">Account Settings</h2>
                        <p className="text-xs font-bold text-card-text/40 uppercase tracking-widest mt-2 flex items-center gap-2">
                            <Settings className="w-3 h-3" /> Update your personal information and security preferences
                        </p>
                    </div>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                        </div>
                    ) : teacherData ? (
                        <TeacherForm
                            orgSlug={orgName}
                            initialData={teacherData}
                            isProfile={true}
                        />
                    ) : (
                        <div className="py-20 text-center text-card-text/60 font-bold uppercase tracking-widest bg-red-50/50 rounded-sm border border-red-100 italic">
                            Failed to load teacher profile data...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
