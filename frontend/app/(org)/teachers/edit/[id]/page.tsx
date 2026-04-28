'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { UserPlus, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import TeacherForm from '@/components/forms/TeacherForm';
import { useGlobal } from '@/context/GlobalContext';
import { Teacher, Role } from '@/types';
import { NotFound } from '@/components/NotFound';

export default function EditTeacherPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { dispatch } = useGlobal();
    const teacherId = params.id as string;

    // Role guard check
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER) {
                dispatch({ type: 'TOAST_ADD', payload: { message: 'You do not have permission to edit this teacher.', type: 'error' } });
                router.replace('/teachers');
            }
        }
    }, [authLoading, user, router, dispatch]);

    // SWR for teacher data
    const teacherKey = token && teacherId ? ['teacher', teacherId] as const : null;
    const { data: teacherData, isLoading: dataLoading, error } = useSWR<Teacher>(teacherKey);

    const teacherExists = error ? false : (teacherData ? true : null);

    if (authLoading || dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-primary-foreground/60">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="font-bold text-sm tracking-widest">Loading Teacher Data...</p>
                </div>
            </div>
        );
    }

    if (teacherExists === false) {
        return <NotFound page="Teacher" />;
    }

    if (!teacherData) return null;

    return (
        <div className="flex flex-col">
            <div className="mb-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 backdrop-blur-md ml-2 rounded-lg md:rounded-lg border border-border shadow-xl shrink-0">
                        <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-primary/90 tracking-tight drop-shadow-lg text-left">Edit Teacher</h1>
                        <p className="text-muted-foreground font-bold opacity-80 mt-1 text-sm md:text-base text-left tracking-widest text-[10px]">Update Faculty Records</p>
                    </div>
                </div>
            </div>

            <div className="bg-card text-card-text rounded-lg shadow-[0_8px_30px_var(--shadow-color)] border border-border p-6 md:p-12 mb-10">
                <TeacherForm teacherId={teacherId} initialData={teacherData} />
            </div>
        </div>
    );
}
