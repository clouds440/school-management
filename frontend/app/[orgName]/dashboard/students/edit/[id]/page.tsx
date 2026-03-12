'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Loader2, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import StudentForm from '@/components/forms/StudentForm';
import { useToast } from '@/context/ToastContext';
import { Student, Role } from '@/types';

export default function EditStudentPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const { showToast } = useToast();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];
    const studentId = params.id as string;

    const [studentData, setStudentData] = useState<Student | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // Wait for auth to finish loading before doing anything
        if (authLoading) return;

        const fetchStudent = async () => {
            // Role guard
            if (!user || (user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER && user.role !== Role.TEACHER)) {
                if (isMounted) router.replace(`/${orgSlug}/dashboard`);
                return;
            }

            try {
                const data = await api.org.getStudent(studentId, token!);
                if (isMounted) {
                    setStudentData(data);
                }
            } catch (error: unknown) {
                if (!isMounted) return;

                showToast(error instanceof Error ? error.message : 'Failed to load student.', 'error');
                router.replace(`/${orgSlug}/dashboard/students`);
            } finally {
                if (isMounted) setDataLoading(false);
            }
        };

        fetchStudent();

        return () => {
            isMounted = false;
        };
    }, [authLoading, user, token, studentId, orgSlug, router, showToast]);

    // Show a spinner while auth is loading or data is being fetched
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

    return (
        <>
            <div className="mb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl shrink-0">
                        <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">Edit Student</h1>
                        <p className="text-white/80 font-bold opacity-80 mt-1 text-sm md:text-base uppercase tracking-widest text-[10px]">UPDATE LEARNER RECORDS</p>
                    </div>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/20 p-6 md:p-12 text-card-text">
                <StudentForm orgSlug={orgSlug} studentId={studentId} initialData={studentData} />
            </div>
        </>
    );
}
