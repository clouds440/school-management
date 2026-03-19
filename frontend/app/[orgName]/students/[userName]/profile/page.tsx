'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Student } from '@/types';
import { StudentPortalShell } from '@/components/student/StudentPortalShell';
import StudentForm from '@/components/forms/StudentForm';
import { Settings } from 'lucide-react';

export default function StudentProfilePage({ params }: { params: { orgName: string; userName: string } }) {
    const { token } = useAuth();
    const [studentData, setStudentData] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        api.org.getProfile(token)
            .then(setStudentData)
            .catch(err => console.error('Failed to fetch profile:', err))
            .finally(() => setLoading(false));
    }, [token]);

    return (
        <StudentPortalShell activeTab="profile">
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
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                        </div>
                    ) : studentData ? (
                        <StudentForm 
                            orgSlug={params.orgName} 
                            initialData={studentData} 
                            isProfile={true} 
                        />
                    ) : (
                        <div className="py-20 text-center text-card-text/60 font-bold uppercase tracking-widest">
                            Failed to load profile data
                        </div>
                    )}
                </div>
            </div>
        </StudentPortalShell>
    );
}
