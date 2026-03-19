'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Student } from '@/types';
import StudentForm from '@/components/forms/StudentForm';
import { Settings } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function StudentProfilePage() {
    const { token } = useAuth();
    const params = useParams();
    const [studentData, setStudentData] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    const orgSlug = params.orgName as string;

    useEffect(() => {
        if (!token) return;
        api.org.getProfile(token)
            .then(setStudentData)
            .catch(err => console.error('Failed to fetch profile:', err))
            .finally(() => setLoading(false));
    }, [token]);

    return (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden mt-8 animate-fade-in-up">
            <div className="p-8 border-b border-primary/10 bg-primary/5 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-sm">
                    <Settings className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Account Settings</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
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
                        orgSlug={orgSlug} 
                        initialData={studentData} 
                        isProfile={true} 
                    />
                ) : (
                    <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">
                        Failed to load profile data
                    </div>
                )}
            </div>
        </div>
    );
}
