'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Teacher } from '@/types';
import TeacherForm from '@/components/forms/TeacherForm';
import { Settings, UserCircle } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function TeacherProfilePage() {
    const { token } = useAuth();
    const params = useParams();
    const [teacherData, setTeacherData] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);

    const orgSlug = params.orgName as string;

    useEffect(() => {
        if (!token) return;
        api.org.getProfile(token)
            .then(setTeacherData)
            .catch(err => console.error('Failed to fetch profile:', err))
            .finally(() => setLoading(false));
    }, [token]);

    return (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden mt-8">
            <div className="p-8">
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                ) : teacherData ? (
                    <TeacherForm 
                        orgSlug={orgSlug} 
                        initialData={teacherData} 
                        isProfile={true} 
                    />
                ) : (
                    <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest bg-red-50/50 rounded-sm border border-red-100 italic text-xs">
                        Failed to load teacher profile data...
                    </div>
                )}
            </div>
        </div>
    );
}
