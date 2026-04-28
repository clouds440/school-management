'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, UserPlus } from 'lucide-react';
import useSWR from 'swr';
import StudentForm from '@/components/forms/StudentForm';
import { useGlobal } from '@/context/GlobalContext';
import { Student, Role } from '@/types';
import { NotFound } from '@/components/NotFound';

export default function EditStudentPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { dispatch } = useGlobal();
    const studentId = params.id as string;

    // Role guard check
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER && user.role !== Role.TEACHER) {
                router.replace('/');
            }
        }
    }, [authLoading, user, router]);

    // SWR for student data
    const studentKey = token && studentId ? ['student', studentId] as const : null;
    const { data: studentData, isLoading: dataLoading, error } = useSWR<Student>(studentKey);

    // Teacher permission check
    useEffect(() => {
        if (user?.role === Role.TEACHER && studentData) {
            const isMyStudent = studentData.enrollments?.some(e =>
                e.section?.teachers?.some(t => t.userId === user.id)
            );
            if (!isMyStudent) {
                dispatch({ type: 'TOAST_ADD', payload: { message: 'You do not have permission to view this student record.', type: 'error' } });
                router.replace('/students');
            }
        }
    }, [user, studentData, router, dispatch]);

    const studentExists = error ? false : (studentData ? true : null);

    if (authLoading || dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-primary-foreground/60">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="font-bold text-sm tracking-widest">Loading Student Data...</p>
                </div>
            </div>
        );
    }

    if (studentExists === false) {
        return <NotFound page="Student" />;
    }

    if (!studentData) return null;

    const isWatchMode = user?.role === Role.TEACHER;

    return (
        <div className="flex flex-col">
            <div className="mb-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 backdrop-blur-md rounded-lg border border-border shadow-xl shrink-0">
                        <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight drop-shadow-lg">
                            {isWatchMode ? 'View Student' : 'Edit Student'}
                        </h1>
                        <p className="text-muted-foreground font-bold opacity-80 mt-1 text-sm md:text-base tracking-widest text-[10px]">
                            {isWatchMode ? 'Read-only Learner Records' : 'Update Learner Records'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl rounded-lg shadow-2xl border border-border p-6 md:p-12 text-card-text mb-10">
                <StudentForm studentId={studentId} initialData={studentData} />
            </div>
        </div>
    );
}
