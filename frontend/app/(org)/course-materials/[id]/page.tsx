'use client';

import { useAuth } from '@/context/AuthContext';
import { BookOpen, GraduationCap, Calendar, MapPin, FileText } from 'lucide-react';
import useSWR from 'swr';
import { Section, Role } from '@/types';
import { useParams } from 'next/navigation';
import CourseMaterials from '@/components/sections/CourseMaterials';
import { Loading } from '@/components/ui/Loading';
import { NotFound } from '@/components/NotFound';

export default function CourseMaterialsPage() {
    const { token, user } = useAuth();
    const params = useParams();

    const sectionId = params.id as string;

    // SWR for section data
    const sectionKey = token && sectionId ? ['section-materials', sectionId] as const : null;
    const { data: section, isLoading, error } = useSWR<Section>(sectionKey);
    const sectionExists = error ? false : (section ? true : null);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <Loading size="lg" />
            </div>
        );
    }

    if (sectionExists === false) {
        return <NotFound page="Section" />;
    }

    if (!section) return null;

    // Check if teacher is assigned to this section
    const isTeacherAssigned = section.teachers?.some(t => t.userId === user?.id)

    return (
        <div className="flex flex-col w-full space-y-8">
            {/* Header Card */}
            <div className="bg-card/80 backdrop-blur-2xl rounded-lg shadow-xl border border-border p-2 md:p-4 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="p-6 bg-primary/10 rounded-lg shadow-inner border border-primary/20">
                            <BookOpen className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black tracking-[0.2em] rounded-lg shadow-lg shadow-primary/20">
                                    Section ID: {section.id.substring(0, 8)}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none mb-4 text-foreground">
                                {section.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[11px] font-black tracking-widest text-card-text/40">
                                <span className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-primary" />
                                    {section.course?.name || 'COURSE'}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    {section.academicCycle?.name || 'Academic Cycle'}
                                    {section.cohort && (
                                        <span className="ml-1 opacity-50 font-medium tracking-tight">({section.cohort.name})</span>
                                    )}
                                </span>
                                {section.room && (
                                    <span className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        Venue: {section.room}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Materials Panel */}
            <div className="bg-card text-card-text rounded-lg shadow-2xl border border-border overflow-hidden">
                <div className="p-8 border-b border-border bg-linear-to-r from-primary/10 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/20 rounded-lg">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter leading-none">Course Materials</h2>
                            <p className="text-[10px] font-black text-card-text/40 tracking-widest mt-1">View and download learning resources</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 md:p-10">
                    <CourseMaterials sectionId={sectionId} role={user?.role as Role} isTeacherAssigned={isTeacherAssigned} />
                </div>
            </div>
        </div>
    );
}
