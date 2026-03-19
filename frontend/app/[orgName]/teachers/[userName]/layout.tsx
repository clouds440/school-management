'use client';

import { useAuth } from '@/context/AuthContext';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Teacher } from '@/types';
import { ResourceTabs } from '@/components/ui/ResourceTabs';
import { LayoutDashboard, User, Book, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicUrl } from '@/lib/utils';

export default function TeacherDetailLayout({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    const params = useParams();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);

    const orgSlug = params.orgName as string;
    const userName = params.userName as string;

    useEffect(() => {
        if (!token || !userName) return;

        api.org.getTeachers(token, { search: userName }).then(res => {
            const found = res.data.find(t => t.user.userName === userName);
            setTeacher(found || null);
        }).finally(() => setLoading(false));
    }, [token, userName]);

    const tabs = useMemo(() => [
        { id: 'overview', label: 'Overview', href: `/${orgSlug}/teachers/${userName}`, icon: LayoutDashboard },
        { id: 'profile', label: 'Profile Settings', href: `/${orgSlug}/teachers/${userName}/profile`, icon: User },
    ], [orgSlug, userName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-2xl font-black uppercase tracking-tight text-card-text/40">Teacher Not Found</h2>
                <Link href={`/${orgSlug}/teachers`} className="text-primary font-bold mt-4 inline-block hover:underline">Back to Teachers</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            {/* Header / Breadcrumb */}
            <div className="mb-8 flex items-center justify-between">
                <Link
                    href={`/${orgSlug}/teachers`}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-card-text/40 hover:text-primary transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Teachers
                </Link>
            </div>

            {/* Teacher Header Card */}
            <div className="bg-card text-card-text rounded-sm shadow-2xl border border-white/20 p-8 md:p-10 mb-8 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="shrink-0">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-sm border-4 border-white/10 shadow-2xl overflow-hidden bg-primary/5 flex items-center justify-center relative group/avatar">
                            {teacher.user.avatarUrl ? (
                                <Image
                                    src={getPublicUrl(teacher.user.avatarUrl)}
                                    alt={teacher.user.name}
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                                    unoptimized
                                />
                            ) : (
                                <User className="w-12 h-12 md:w-16 md:h-16 text-primary/20" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                                {teacher.user.name}
                            </h1>
                            <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] italic rounded-sm self-center md:self-auto">
                                {teacher.designation || 'FACULTY'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[11px] font-black uppercase tracking-widest text-card-text/40">
                            <div className="flex items-center gap-2">
                                <Book className="w-4 h-4 text-primary" />
                                {teacher.subject || 'NOT ASSIGNED'}
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                                {teacher.user.email}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resource Tabs */}
            <ResourceTabs tabs={tabs} activeTab={''} onTabChange={function (id: string): void {
                throw new Error('Function not implemented.');
            }} />

            {/* Tab Content */}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
