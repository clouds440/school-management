'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Trophy, BookOpen, GraduationCap, ChevronRight, Search, FileBarChart } from 'lucide-react';
import { api } from '@/lib/api';
import { Section, Role, FinalGradeResponse } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';

export default function GradesPage() {
    const { token, user } = useAuth();
    const params = useParams();
    const { showToast } = useToast();
    const [sections, setSections] = useState<Section[]>([]);
    const [studentGrades, setStudentGrades] = useState<FinalGradeResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const orgSlug = params.orgName as string;

    const fetchGradesData = useCallback(async () => {
        if (!token || !user) return;
        setIsLoading(true);
        try {
            if (user.role === Role.STUDENT) {
                const grades = await api.org.getOwnFinalGrades(token);
                setStudentGrades(grades);
            } else {
                // Admins/Teachers see sections to manage
                const params = user.role === Role.TEACHER ? { my: true } : {};
                const data = await api.org.getSections(token, params);
                setSections(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch grades data:', error);
            showToast('Failed to load grades information', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [token, user, showToast]);

    useEffect(() => {
        fetchGradesData();
    }, [fetchGradesData]);

    const filteredSections = sections.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.course?.name && s.course.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up space-y-8">
            {/* Header */}
            <div className="bg-card text-card-text rounded-sm shadow-xl border border-white/20 p-8 md:p-10 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-primary/10 rounded-sm shadow-inner border border-primary/20">
                            <Trophy className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                                {user?.role === Role.STUDENT ? 'My Grade Board' : 'Grading Management'}
                            </h1>
                            <p className="text-[10px] font-black text-card-text/40 uppercase tracking-widest mt-2">
                                {user?.role === Role.STUDENT ? 'Performance summary across all enrolled sessions' : 'Select a section to manage assessments and student grades'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {user?.role === Role.STUDENT ? (
                /* Student View - Grade Summary */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studentGrades.length === 0 ? (
                        <div className="col-span-full bg-primary/5 border border-dashed border-white/10 rounded-sm p-20 text-center">
                            <FileBarChart className="w-16 h-16 text-card-text/20 mx-auto mb-4" />
                            <p className="text-card-text/40 font-bold italic uppercase tracking-widest">No grades have been finalized yet.</p>
                        </div>
                    ) : (
                        studentGrades.map((grade, idx) => (
                            <div key={idx} className="bg-card border border-white/5 rounded-sm p-6 space-y-4 hover:border-primary/40 transition-all group shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[3px] bg-primary/20 group-hover:bg-primary transition-colors"></div>
                                <div>
                                    <h3 className="text-lg font-black italic uppercase tracking-tight text-card-text leading-tight">{grade.sectionName}</h3>
                                    <p className="text-[10px] font-black text-card-text/40 uppercase tracking-widest mt-1">{grade.courseName}</p>
                                </div>
                                <div className="flex items-end justify-between pt-4 border-t border-white/5">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-card-text/30 uppercase tracking-widest mb-1">TOTAL Percentage</p>
                                        <p className="text-3xl font-black italic text-primary">{grade.finalPercentage.toFixed(1)}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-card-text/30 uppercase tracking-widest mb-1">LETTER GRADE</p>
                                        <p className="text-4xl font-black italic text-card-text/80">{grade.letterGrade || 'N/A'}</p>
                                    </div>
                                </div>
                                <Link 
                                    href={`/${orgSlug}/dashboard/sections/${grade.sectionId}`}
                                    className="w-full h-10 mt-2 text-[10px] uppercase font-black italic gap-1.5 flex items-center justify-center bg-white/5 hover:bg-white/10 text-card-text/60 hover:text-card-text border border-white/5 transition-all rounded-sm shadow-sm"
                                >
                                    View Detailed Breakdown
                                </Link>
                            </div>
                        )
                    ))}
                </div>
            ) : (
                /* Admin/Teacher View - Sections Selection */
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-card/50 p-6 rounded-sm border border-white/5 shadow-inner">
                        <div className="flex-1 max-w-md">
                            <Input 
                                placeholder="Search sections or courses..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={Search}
                            />
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase text-card-text/30 tracking-widest">
                            <GraduationCap className="w-4 h-4" />
                            <span>Total Sections: {sections.length}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSections.length === 0 ? (
                            <div className="col-span-full bg-primary/5 border border-dashed border-white/10 rounded-sm p-20 text-center">
                                <BookOpen className="w-16 h-16 text-card-text/20 mx-auto mb-4" />
                                <p className="text-card-text/40 font-bold italic uppercase tracking-widest">No matching sections found.</p>
                            </div>
                        ) : (
                            filteredSections.map(section => (
                                <Link
                                    key={section.id}
                                    href={`/${orgSlug}/dashboard/sections/${section.id}`}
                                    className="bg-card border border-white/5 rounded-sm p-8 space-y-4 hover:border-primary/50 transition-all group shadow-sm flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-primary/5 rounded-sm border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                <GraduationCap className="w-6 h-6" />
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-card-text/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </div>
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-card-text leading-tight group-hover:text-primary transition-colors">{section.name}</h3>
                                        <p className="text-[10px] font-black text-card-text/40 uppercase tracking-widest mt-2">{section.course?.name || 'GENERIC COURSE'}</p>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-card-text/30">
                                        <span>{section.semester} {section.year}</span>
                                        <span className="bg-primary/5 px-2 py-1 rounded-sm text-primary group-hover:bg-primary group-hover:text-white transition-all">MANAGE GRADES</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
