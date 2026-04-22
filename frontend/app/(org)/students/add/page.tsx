'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Role } from '@/types';
import StudentForm from '@/components/forms/StudentForm';

export default function AddStudentPage() {
    const { user } = useAuth();
    const router = useRouter();
    // Redirect if not authorized
    useEffect(() => {
        if (user && user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER && user.role !== Role.TEACHER) {
            router.push(`/students/${user.userName}`);
        }
    }, [user, router]);

    return (
        <div className="flex flex-col">
            <div className="mb-6 p-2">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 backdrop-blur-md rounded-lg border border-border shadow-xl shrink-0">
                        <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight drop-shadow-lg">Admit Student</h1>
                        <p className="text-muted-foreground font-bold opacity-80 mt-1 text-sm md:text-base uppercase tracking-widest text-[10px]">REGISTER NEW LEARNER ACCOUNT</p>
                    </div>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl rounded-lg shadow-2xl border border-border p-6 md:p-12 text-card-text">
                <StudentForm />
            </div>
        </div>
    );
}
