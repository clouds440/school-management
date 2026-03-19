'use client';

import { useAuth } from '@/context/AuthContext';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Section } from '@/types';
import { ResourceTabs } from '@/components/ui/ResourceTabs';
import { LayoutDashboard, Trophy, Users, BookOpen, ArrowLeft, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function SectionDetailLayout({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    const params = useParams();
    const [section, setSection] = useState<Section | null>(null);
    const [loading, setLoading] = useState(true);

    const orgSlug = params.orgName as string;
    const sectionId = params.id as string;

    useEffect(() => {
        if (!token || !sectionId) return;

        api.org.getSection(sectionId, token).then(setSection).finally(() => setLoading(false));
    }, [token, sectionId]);

    const tabs = useMemo(() => [
        { id: 'overview', label: 'Overview', href: `/${orgSlug}/sections/${sectionId}`, icon: LayoutDashboard },
        { id: 'assessments', label: 'Assessments', href: `/${orgSlug}/sections/${sectionId}/assessments`, icon: Trophy },
    ], [orgSlug, sectionId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!section) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-2xl font-black uppercase tracking-tight text-card-text/40">Section Not Found</h2>
                <Link href={`/${orgSlug}/sections`} className="text-primary font-bold mt-4 inline-block hover:underline">Back to Sections</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            {/* Header / Breadcrumb */}
            <div className="mb-8 flex items-center justify-between">
                <Link
                    href={`/${orgSlug}/sections`}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-card-text/40 hover:text-primary transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Sections
                </Link>
            </div>

            {/* Section Header Card */}
            <div className="bg-card text-card-text rounded-sm shadow-2xl border border-white/20 p-8 md:p-12 mb-8 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="p-6 bg-primary/10 rounded-sm shadow-inner border border-primary/20 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <BookOpen className="w-16 h-16 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] italic rounded-sm shadow-lg shadow-primary/20">
                                    {section.course?.name || 'GENERIC COURSE'}
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none mb-4">
                                {section.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[11px] font-black uppercase tracking-widest text-card-text/40">
                                <span className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    {section.students?.length || 0} ENROLLED STUDENTS
                                </span>
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    {section.semester} {section.year}
                                </span>
                                {section.room && (
                                    <span className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        ROOM: {section.room}
                                    </span>
                                )}
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
