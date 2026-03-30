'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Loader2, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import StudentForm from '@/components/forms/StudentForm';
import { useGlobal } from '@/context/GlobalContext';
import { Student, Role } from '@/types';

export default function EditStudentPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const { state, dispatch } = useGlobal();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];
    const studentId = params.id as string;

    const [studentData, setStudentData] = useState<Student | null>(null);
    const dataLoading = state.ui.isLoading;

    useEffect(() => {
        let isMounted = true;

        if (authLoading) return;

        const fetchStudent = async () => {
            dispatch({ type: 'UI_SET_LOADING', payload: true });
            if (!user || !token) return;

            if (user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER && user.role !== Role.TEACHER) {
                if (isMounted) router.replace(`/${orgSlug}`);
                return;
            }

            try {
                const data = await api.org.getStudent(studentId, token);
                
                if (user.role === Role.TEACHER) {
                    const isMyStudent = data.enrollments?.some(e => 
                        e.section?.teachers?.some(t => t.userId === user.id)
                    );
                    if (!isMyStudent) {
                        dispatch({ type: 'TOAST_ADD', payload: { message: 'You do not have permission to view this student record.', type: 'error' } });
                        router.replace(`/${orgSlug}/students`);
                        return;
                    }
                }

                if (isMounted) {
                    setStudentData(data);
                }
            } catch (error: unknown) {
                if (!isMounted) return;

                dispatch({ type: 'TOAST_ADD', payload: { message: error instanceof Error ? error.message : 'Failed to load student.', type: 'error' } });
                router.replace(`/${orgSlug}/students`);
            } finally {
                if (isMounted) dispatch({ type: 'UI_SET_LOADING', payload: false });
            }
        };

        fetchStudent();

        return () => {
            isMounted = false;
        };
    }, [authLoading, user, token, studentId, orgSlug, router, dispatch]);

    if (authLoading || dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-white/60">
                    <Loader2 className="w-10 h-10 animate-spin text-white" />
                    <p className="font-bold text-sm uppercase tracking-widest">Loading Student Data...</p>
                </div>
            </div>
        );
    }

    if (!studentData) return null;

    const isWatchMode = user?.role === Role.TEACHER;

    return (
        <>
            <div className="mb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl shrink-0">
                        <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                            {isWatchMode ? 'View Student' : 'Edit Student'}
                        </h1>
                        <p className="text-white/80 font-bold opacity-80 mt-1 text-sm md:text-base uppercase tracking-widest text-[10px]">
                            {isWatchMode ? 'READ-ONLY LEARNER RECORDS' : 'UPDATE LEARNER RECORDS'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/20 p-6 md:p-12 text-card-text">
                <StudentForm orgSlug={orgSlug} studentId={studentId} initialData={studentData} />
            </div>
        </>
    );
}
