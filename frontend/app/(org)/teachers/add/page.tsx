'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Role } from '@/types';
import TeacherForm from '@/components/forms/TeacherForm';

export default function AddTeacherPage() {
    const { user, token } = useAuth();
    const router = useRouter();

    // Redirect if not authorized
    useEffect(() => {
        if (user && user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER) {
            router.push(`/teachers/${user.userName}`);
        }
    }, [user, router]);

    return (
        <div className="flex flex-col">
            <div className="mb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 backdrop-blur-md ml-2 rounded-sm md:rounded-sm border border-border shadow-xl shrink-0">
                        <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground mb-2">Add Faculty Member</h1>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Create a new teacher account for your organization</p>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-border p-6 md:p-12 mb-10">
                <TeacherForm />
            </div>
        </div>
    );
}
