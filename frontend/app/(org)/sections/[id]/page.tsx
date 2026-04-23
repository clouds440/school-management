'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, GraduationCap, Users, Trophy, Calendar, MapPin, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { Section, Role } from '@/types';
import { useGlobal } from '@/context/GlobalContext';
import { useParams, useRouter } from 'next/navigation';
import AssessmentList from '@/components/sections/AssessmentList';
import SectionSchedules from '@/components/sections/SectionSchedules';
import CourseMaterials from '@/components/sections/CourseMaterials';
import { Loading } from '@/components/ui/Loading';

export default function SectionDetailPage() {
    const { token, user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const { state, dispatch } = useGlobal();
    const [section, setSection] = useState<Section | null>(null);
    const isLoading = state.ui.isLoading;

    const sectionId = params.id as string;

    const fetchSection = useCallback(async () => {
        if (!token || !sectionId) return;
        dispatch({ type: 'UI_SET_LOADING', payload: true });
        try {
            const data = await api.org.getSection(sectionId, token);
            setSection(data);
        } catch (error) {
            console.error('Failed to fetch section:', error);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load section details', type: 'error' } });
            router.push('/sections');
        } finally {
            dispatch({ type: 'UI_SET_LOADING', payload: false });
        }
    }, [token, sectionId, dispatch, router]);

    useEffect(() => {
        fetchSection();
    }, [fetchSection]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <Loading size="lg" />
            </div>
        );
    }

    if (!section) return null;

    return (
        <div className="flex flex-col w-full space-y-8">
            {/* Header Card - Premium Design */}
            <div className="bg-card/80 backdrop-blur-2xl rounded-lg shadow-xl border border-border p-2 md:p-4 relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="p-6 bg-primary/10 rounded-lg shadow-inner border border-primary/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
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
                                <span className="flex items-center gap-2 group/item">
                                    <GraduationCap className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                                    {section.course?.name || 'COURSE'}
                                </span>
                                <span className="flex items-center gap-2 group/item">
                                    <Users className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                                    {section.students?.length || 0} Enrolled Students
                                </span>
                                <span className="flex items-center gap-2 group/item">
                                    <Calendar className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                                    {section.semester} {section.year}
                                </span>
                                {section.room && (
                                    <span className="flex items-center gap-2 group/item">
                                        <MapPin className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                                        Venue: {section.room}
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
                <div className="bg-card text-card-text rounded-lg shadow-2xl border border-border overflow-hidden transform transition-all hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)]">
                    <div className="p-8 border-b border-border bg-linear-to-r from-primary/10 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/20 rounded-lg">
                                <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter leading-none">Course Evaluations</h2>
                                <p className="text-[10px] font-black text-card-text/40 tracking-widest mt-1">Manage assessments, quizzes & final grades</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-10">
                        <AssessmentList section={section} role={user?.role as Role} />
                    </div>
                </div>

                {/* Schedules Panel */}
                <div className="bg-card text-card-text rounded-lg shadow-2xl border border-border overflow-hidden transform transition-all hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] mt-8">
                    <div className="p-8 border-b border-border bg-linear-to-r from-primary/10 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/20 rounded-lg">
                                <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter leading-none">Class Schedule</h2>
                                <p className="text-[10px] font-black text-card-text/40 tracking-widest mt-1">Manage weekly timetable and slots</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-10">
                        <SectionSchedules section={section} role={user?.role as Role} />
                    </div>
                </div>

                {/* Course Materials Panel */}
                <div className="bg-card text-card-text rounded-lg shadow-2xl border border-border overflow-hidden transform transition-all hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] mt-8">
                    <div className="p-8 border-b border-border bg-linear-to-r from-primary/10 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/20 rounded-lg">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter leading-none">Course Materials</h2>
                                <p className="text-[10px] font-black text-card-text/40 tracking-widest mt-1">Upload and manage learning resources</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-10">
                        <CourseMaterials sectionId={sectionId} role={user?.role as Role} />
                    </div>
                </div>
            </div>
        </div>
    );
}
