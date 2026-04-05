'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Role } from '@/types';
import TeacherForm from '@/components/forms/TeacherForm';

export default function AddTeacherPage() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    // Redirect if not authorized
    useEffect(() => {
        if (user && user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER) {
            router.push(`/${orgSlug}/teachers/${user.userName}`);
        }
    }, [user, orgSlug, router]);

    return (
        <div className="flex flex-col">
            <div className="mb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 backdrop-blur-md ml-2 rounded-sm md:rounded-sm border border-white/30 shadow-xl shrink-0">
                        <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tight drop-shadow-lg text-left">Add Teacher</h1>
                        <p className="text-gray-600 font-bold opacity-80 mt-1 text-sm md:text-base text-left uppercase tracking-widest text-[10px]">CREATE NEW FACULTY ACCOUNT</p>
                    </div>
                </div>
            </div>

            <div className="bg-secondary rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-black/20 p-6 md:p-12 mb-10">
                <TeacherForm orgSlug={orgSlug} />
            </div>
        </div>
    );
}
