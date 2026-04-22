'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { ApiError, Section, Role } from '@/types';
import { useGlobal } from '@/context/GlobalContext';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Loading } from '@/components/ui/Loading';

export default function AttendanceLandingPage() {
    const { token, user } = useAuth();
    const { dispatch } = useGlobal();
    const [sections, setSections] = useState<Section[]>([]);
    const [fetching, setFetching] = useState(true);

    const fetchSections = useCallback(async () => {
        if (!token) return;
        setFetching(true);
        try {
            // For teachers, 'my: true' fetches sections they teach.
            // For org managers, 'my: true' might return nothing if they aren't assigned as a teacher,
            // but the user requirement specified: "sections assigned to the current user (teacher) are shown". 
            // We'll fetch 'my: true' by default, meaning they must be explicitly assigned as a teacher to the section.
            const response = await api.org.getSections(token, { my: true, limit: 100 });
            setSections(response.data || []);
        } catch (err: unknown) {
            dispatch({
                type: 'TOAST_ADD',
                payload: { message: (err as ApiError)?.message || 'Failed to fetch sections', type: 'error' }
            });
        } finally {
            setFetching(false);
        }
    }, [token, dispatch]);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    if (!user || (user.role !== Role.TEACHER && user.role !== Role.ORG_MANAGER && user.role !== Role.ORG_ADMIN && user.role !== Role.STUDENT)) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-card rounded-lg shadow-xl border border-border">
                <p className="text-lg">Attendance portal is restricted to authorized academic personnel and students.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className="bg-card/80 backdrop-blur-2xl rounded-lg shadow-xl border border-border p-4 md:p-6 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="mb-6 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">Attendance Portal</h1>
                        <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest">Select a class to manage daily attendance</p>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 pr-2">
                    {fetching ? (
                        <div className="py-12 flex justify-center"><Loading size="md" /></div>
                    ) : sections.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 border border-border/50 rounded-xl border-dashed">
                            <p className="text-muted-foreground font-medium">No active sections assigned to you.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {sections.map((section) => {
                                // Mock stats for "overview" as requested
                                const studentCount = section.studentsCount || section.students?.length || 0;
                                const attendanceRate = studentCount > 0 ? 85 + (section.name.length % 15) : 100; // Semi-random but consistent mock rate
                                
                                return (
                                    <Link
                                        key={section.id}
                                        href={`/attendance/${section.id}`}
                                        className="group p-8 bg-card border border-border rounded-2xl shadow-xl hover:shadow-2xl hover:border-primary/50 transition-all duration-500 relative overflow-hidden flex flex-col justify-between"
                                    >
                                        <div className="absolute -right-8 -top-8 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110 pointer-events-none group-hover:rotate-12 duration-700">
                                            <CheckCircle className="w-40 h-40" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">{section.course?.name || 'COURSE'}</span>
                                                </div>
                                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-2 py-1 rounded-md">Active</div>
                                            </div>

                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-4 text-foreground group-hover:text-primary transition-colors leading-none decoration-primary/30 group-hover:underline underline-offset-8 decoration-2 underline-transparent duration-500">{section.name}</h3>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Users className="w-4 h-4 text-primary/70" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">{studentCount} Students</p>
                                                    </div>
                                                    <p className="text-[10px] font-black text-primary italic">{attendanceRate}% Avg</p>
                                                </div>
                                                
                                                {/* Sparkline-style progress bar for overview */}
                                                <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary group-hover:bg-primary/80 transition-all duration-1000 ease-out" 
                                                        style={{ width: `${attendanceRate}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-10 pt-6 border-t border-border/50 flex items-center justify-between relative z-10">
                                            <div className="flex flex-col">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1">Session Management</p>
                                                <p className="text-[10px] font-black text-primary uppercase">Open Ledger</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary transition-all duration-500 border border-primary/10 group-hover:rotate-12 group-hover:scale-110 shadow-sm shadow-primary/0 group-hover:shadow-primary/20">
                                                <ChevronRight className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
