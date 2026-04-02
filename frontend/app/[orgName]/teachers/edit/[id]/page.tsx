'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { UserPlus, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import TeacherForm from '@/components/forms/TeacherForm';
import { useGlobal } from '@/context/GlobalContext';
import { Teacher, Role } from '@/types';

export default function EditTeacherPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const { state, dispatch } = useGlobal();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];
    const teacherId = params.id as string;

    const [teacherData, setTeacherData] = useState<Teacher | null>(null);
    const dataLoading = state.ui.isLoading;

    useEffect(() => {
        let isMounted = true;

        // Wait for auth to finish loading before doing anything
        if (authLoading) return;

        // Fetch the teacher data now that we have a valid token
        const fetchTeacher = async () => {
            dispatch({ type: 'UI_SET_LOADING', payload: true });
            // Role guard: only ORG_ADMIN and ORG_MANAGER can edit teachers
            if (!user || (user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER)) {
                if (isMounted) router.replace(`/${orgSlug}`);
                return;
            }

            try {
                const data = await api.org.getTeacher(teacherId, token!);
                if (isMounted) {
                    setTeacherData(data);
                }
            } catch (error: unknown) {
                // Ignore errors if component unmounted (e.g. strict mode remount)
                if (!isMounted) return;

                dispatch({ type: 'TOAST_ADD', payload: { message: error instanceof Error ? error.message : 'Failed to load teacher.', type: 'error' } });
                router.replace(`/${orgSlug}/teachers`);
            } finally {
                if (isMounted) dispatch({ type: 'UI_SET_LOADING', payload: false });
            }
        };

        fetchTeacher();

        return () => {
            isMounted = false;
        };
    }, [authLoading, user, token, teacherId, orgSlug, router, dispatch]);

    // Show a spinner while auth is loading or data is being fetched
    if (authLoading || dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-white/60">
                    <Loader2 className="w-10 h-10 animate-spin text-white" />
                    <p className="font-bold text-sm uppercase tracking-widest">Loading Teacher Data...</p>
                </div>
            </div>
        );
    }

    if (!teacherData) return null;

    return (
        <div className="flex flex-col">
            <div className="mb-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 backdrop-blur-md ml-2 rounded-sm md:rounded-sm border border-white/30 shadow-xl shrink-0">
                        <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-primary/90 tracking-tight drop-shadow-lg text-left">Edit Teacher</h1>
                        <p className="text-gray-600 font-bold opacity-80 mt-1 text-sm md:text-base text-left uppercase tracking-widest text-[10px]">UPDATE FACULTY RECORDS</p>
                    </div>
                </div>
            </div>

            <div className="bg-card text-card-text rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-white/20 p-6 md:p-12 mb-10">
                <TeacherForm orgSlug={orgSlug} teacherId={teacherId} initialData={teacherData} />
            </div>
        </div>
    );
}
