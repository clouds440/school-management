'use client';

import { useAuth } from '@/context/AuthContext';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Student } from '@/types';
import { ResourceTabs } from '@/components/ui/ResourceTabs';
import { LayoutDashboard, User, Book, Trophy, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicUrl } from '@/lib/utils';

export default function StudentDetailLayout({ children }: { children: React.ReactNode }) {
    const { token, user: currentUser } = useAuth();
    const params = useParams();
    const pathname = usePathname();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    const orgSlug = params.orgName as string;
    const userName = params.userName as string;

    useEffect(() => {
        if (!token || !userName) return;

        // If the current user is the student themselves, we might already have the data in context,
        // but for consistency (especially for admins viewing students), we fetch by username.
        // Actually, for now let's assume we can fetch by username or handle it accordingly.
        // The API might need a 'getStudentByUsername' if it doesn't exist.
        // For now, let's use getProfile if it's the current user, or getStudents and filter.

        if (currentUser?.userName === userName) {
            api.org.getProfile(token).then(setStudent).finally(() => setLoading(false));
        } else {
            // Admin/Teacher view - need to get student data. 
            // Ideally api.org.getStudentByUsername(userName, token)
            // For now, let's just fetch all and filter as a workaround if needed, 
            // but let's check if there's a better way.
            api.org.getStudents(token, { search: userName }).then(res => {
                const found = res.data.find(s => s.user.userName === userName);
                setStudent(found || null);
            }).finally(() => setLoading(false));
        }
    }, [token, userName, currentUser]);

    const tabs = useMemo(() => [
        { id: 'overview', label: 'Overview', href: `/${orgSlug}/students/${userName}`, icon: LayoutDashboard },
        { id: 'profile', label: 'Profile', href: `/${orgSlug}/students/${userName}/profile`, icon: User },
        { id: 'courses', label: 'Courses', href: `/${orgSlug}/students/${userName}/courses`, icon: Book },
        { id: 'grades', label: 'Grades', href: `/${orgSlug}/students/${userName}/grades`, icon: Trophy },
        { id: 'attendance', label: 'Attendance', href: `/${orgSlug}/students/${userName}/attendance`, icon: CheckCircle },
    ], [orgSlug, userName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-2xl font-black uppercase tracking-tight text-card-text/40">Student Not Found</h2>
                <Link href={`/${orgSlug}/students`} className="text-primary font-bold mt-4 inline-block hover:underline">Back to Students</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            {/* Header / Breadcrumb */}
            <div className="mb-8 flex items-center justify-between">
                <Link
                    href={`/${orgSlug}/students`}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-card-text/40 hover:text-primary transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Students
                </Link>
            </div>

            {/* Student Header Card */}
            <div className="bg-card text-card-text rounded-sm shadow-2xl border border-white/20 p-8 md:p-10 mb-8 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="shrink-0">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-sm border-4 border-white/10 shadow-2xl overflow-hidden bg-primary/5 flex items-center justify-center relative group/avatar">
                            {student.user.avatarUrl ? (
                                <Image
                                    src={getPublicUrl(student.user.avatarUrl)}
                                    alt={student.user.name}
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
                                {student.user.name}
                            </h1>
                            <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] italic rounded-sm self-center md:self-auto">
                                ID: {student.registrationNumber || student.id.substring(0, 8).toUpperCase()}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[11px] font-black uppercase tracking-widest text-card-text/40">
                            <div className="flex items-center gap-2">
                                <Book className="w-4 h-4 text-primary" />
                                {student.major || 'NOT ASSIGNED'}
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                ROLL NO: {student.rollNumber || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-primary" />
                                {student.status}
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
