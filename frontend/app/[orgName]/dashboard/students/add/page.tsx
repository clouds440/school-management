'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Role } from '@/types';
import StudentForm from '@/components/forms/StudentForm';

export default function AddStudentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    // Redirect if not authorized
    useEffect(() => {
        if (user && user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER && user.role !== Role.TEACHER) {
            router.push(`/${orgSlug}/dashboard`);
        }
    }, [user, orgSlug, router]);

    return (
        <>
            <div className="mb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl shrink-0">
                        <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">Admit Student</h1>
                        <p className="text-white/80 font-bold opacity-80 mt-1 text-sm md:text-base uppercase tracking-widest text-[10px]">REGISTER NEW LEARNER ACCOUNT</p>
                    </div>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/20 p-6 md:p-12 text-card-text">
                <StudentForm orgSlug={orgSlug} />
            </div>
        </>
    );
}
