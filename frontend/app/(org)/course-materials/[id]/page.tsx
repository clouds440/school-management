'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, GraduationCap, Users, Calendar, MapPin, FileText, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Section, Role } from '@/types';
import { useGlobal } from '@/context/GlobalContext';
import { useParams } from 'next/navigation';
import CourseMaterials from '@/components/sections/CourseMaterials';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { NotFound } from '@/components/NotFound';

export default function CourseMaterialsPage() {
    const { token, user } = useAuth();
    const params = useParams();
    const { dispatch } = useGlobal();
    const [section, setSection] = useState<Section | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sectionExists, setSectionExists] = useState<boolean | null>(null);

    const sectionId = params.id as string;

    const fetchSection = useCallback(async () => {
        if (!token || !sectionId) return;
        setIsLoading(true);
        try {
            const data = await api.org.getSection(sectionId, token);
            setSection(data);
            setSectionExists(true);
        } catch (error) {
            console.warn('Failed to fetch section:', error);
            setSectionExists(false);
        } finally {
            setIsLoading(false);
        }
    }, [token, sectionId]);

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

    if (sectionExists === false) {
        return <NotFound page="Section" />;
    }

    if (!section) return null;

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
                                {section.semester && section.year && (
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        {section.semester} {section.year}
                                    </span>
                                )}
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
                    <CourseMaterials sectionId={sectionId} role={user?.role as Role} />
                </div>
            </div>
        </div>
    );
}
