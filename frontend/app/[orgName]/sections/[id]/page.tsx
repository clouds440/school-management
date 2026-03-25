'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, GraduationCap, Users, Trophy, Calendar, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { Section, Role } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useParams, useRouter } from 'next/navigation';
import AssessmentList from '@/components/sections/AssessmentList';

export default function SectionDetailPage() {
    const { token, user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const [section, setSection] = useState<Section | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const sectionId = params.id as string;
    const orgSlug = params.orgName as string;

    const fetchSection = useCallback(async () => {
        if (!token || !sectionId) return;
        setIsLoading(true);
        try {
            const data = await api.org.getSection(sectionId, token);
            setSection(data);
        } catch (error) {
            console.error('Failed to fetch section:', error);
            showToast('Failed to load section details', 'error');
            router.push(`/${orgSlug}/sections`);
        } finally {
            setIsLoading(false);
        }
    }, [token, sectionId, showToast, router, orgSlug]);

    useEffect(() => {
        fetchSection();
    }, [fetchSection]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!section) return null;

    return (
        <div className="flex flex-col w-full animate-fade-in-up space-y-8">
            {/* Header Card - Premium Design */}
            <div className="bg-card text-card-text rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 p-8 md:p-12 relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="p-6 bg-primary/10 rounded-sm shadow-inner border border-primary/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <BookOpen className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] italic rounded-sm shadow-lg shadow-primary/20">
                                    SECTION ID: {section.id.substring(0, 8).toUpperCase()}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none mb-4 text-transparent bg-clip-text bg-linear-to-r from-card-text to-card-text/60">
                                {section.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[11px] font-black uppercase tracking-widest text-card-text/40">
                                <span className="flex items-center gap-2 group/item">
                                    <GraduationCap className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                                    {section.course?.name || 'COURSE'}
                                </span>
                                <span className="flex items-center gap-2 group/item">
                                    <Users className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                                    {section.students?.length || 0} ENROLLED STUDENTS
                                </span>
                                <span className="flex items-center gap-2 group/item">
                                    <Calendar className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                                    {section.semester} {section.year}
                                </span>
                                {section.room && (
                                    <span className="flex items-center gap-2 group/item">
                                        <MapPin className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                                        VENUE: {section.room}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 gap-8">
                {/* Assessments Panel */}
                <div className="bg-card text-card-text rounded-sm shadow-2xl border border-white/10 overflow-hidden transform transition-all hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)]">
                    <div className="p-8 border-b border-white/5 bg-linear-to-r from-primary/10 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/20 rounded-sm">
                                <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Course Evaluations</h2>
                                <p className="text-[10px] font-black text-card-text/40 uppercase tracking-widest mt-1">Manage assessments, quizzes & final grades</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-10">
                        <AssessmentList section={section} role={user?.role as Role} />
                    </div>
                </div>
            </div>
        </div>
    );
}
