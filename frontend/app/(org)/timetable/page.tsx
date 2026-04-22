'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ApiError, TimetableEntry, Role } from '@/types';
import { Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Loading } from '@/components/ui/Loading';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ACADEMIC_DAYS = [1, 2, 3, 4, 5]; // Mon - Fri
const START_HOUR = 8;
const END_HOUR = 18;

const SECTION_COLORS = [
    'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-800',
    'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
    'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
    'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800',
    'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800',
    'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800',
    'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-200 dark:border-fuchsia-800',
    'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
    'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800',
];

const getSectionColor = (id: string) => {
    if (!id) return SECTION_COLORS[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        // Use a more complex hash multiplier to avoid early collisions
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }

    // Use a secondary salt for better distribution
    const salt = (id.length * 31);
    const index = Math.abs(hash + salt) % SECTION_COLORS.length;
    return SECTION_COLORS[index];
};

const toLocalDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getClosestDateForWeekday = (targetDay: number) => {
    const today = new Date();
    const todayDay = today.getDay();

    let bestOffset = 0;
    for (let offset = -6; offset <= 6; offset++) {
        const candidateDay = (todayDay + offset + 7) % 7;
        if (candidateDay !== targetDay) continue;

        if (
            Math.abs(offset) < Math.abs(bestOffset) ||
            (Math.abs(offset) === Math.abs(bestOffset) && offset >= 0)
        ) {
            bestOffset = offset;
        }
    }

    const closestDate = new Date(today);
    closestDate.setDate(today.getDate() + bestOffset);
    return toLocalDateInputValue(closestDate);
};

export default function TimetablePage() {
    const router = useRouter();
    const { token, user } = useAuth();
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !user) {
            setLoading(false);
            return;
        }

        const fetchTimetable = async () => {
            try {
                setLoading(true);
                const data = await api.org.getTimetable(token);
                setEntries(data || []);
            } catch (err: unknown) {
                setError((err as ApiError)?.message || 'Failed to load timetable');
            } finally {
                setLoading(false);
            }
        };
        fetchTimetable();
    }, [token, user]);

    if (loading) return <Loading fullScreen text="Synchronizing Weekly Ledger..." size="lg" />;


    if (error) return (
        <div className="bg-destructive/10 border border-destructive/20 p-8 rounded-3xl text-destructive text-center">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">System Error</h2>
            <p className="font-bold opacity-70 uppercase tracking-widest text-sm">{error}</p>
        </div>
    );

    const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    const getEntryForSlot = (day: number, hour: number) => {
        return entries.find(e => {
            if (e.day !== day) return false;
            const startH = parseInt(e.startTime.split(':')[0], 10);
            const endH = parseInt(e.endTime.split(':')[0], 10);
            return hour >= startH && hour < endH;
        });
    };

    return (
        <div className="flex flex-col h-full w-full space-y-8 pb-12">
            <div className="bg-card/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-border p-8 md:p-10 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="mb-10 border-b border-border/50 pb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-1 bg-primary rounded-full"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Academic Schedule</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter text-foreground leading-none">Weekly Timetable</h1>
                    <p className="text-muted-foreground mt-3 text-sm font-bold uppercase tracking-widest max-w-md">Comprehensive visualization of instructional hours and room allocations.</p>
                </div>

                <div className="flex-1 overflow-auto pr-2 scrollbar-hide border border-border/50 rounded-2xl bg-muted/5 p-4">
                    <div className="min-w-[800px]">
                        {/* Header */}
                        <div className="grid grid-cols-[100px_repeat(5,1fr)] mb-4">
                            <div className="p-2 border-r border-border/50 flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Time</span>
                            </div>
                            {ACADEMIC_DAYS.map(dayIdx => (
                                <div key={dayIdx} className="p-4 flex flex-col items-center justify-center border-b-2 border-primary/20 bg-primary/5 rounded-t-xl mx-1 shadow-xs">
                                    <span className="text-sm font-black uppercase tracking-widest italic">{DAY_NAMES[dayIdx]}</span>
                                    <div className="mt-1 w-4 h-0.5 bg-primary/40 rounded-full"></div>
                                </div>
                            ))}
                        </div>

                        {/* Body */}
                        {timeSlots.map(hour => (
                            <div key={hour} className="grid grid-cols-[100px_repeat(5,1fr)] border-b border-border/30 last:border-b-0 min-h-[100px]">
                                {/* Time Cell */}
                                <div className="flex flex-col items-center justify-center border-r border-border/50 pr-4 bg-muted/5">
                                    <span className="text-xl font-black italic tracking-tighter leading-none">{hour > 12 ? hour - 12 : hour}</span>
                                    <span className="text-[9px] font-black uppercase opacity-40 mt-1 tracking-widest">{hour >= 12 ? 'PM' : 'AM'}</span>
                                </div>

                                {/* Day Cells */}
                                {ACADEMIC_DAYS.map(dayIdx => {
                                    const entry = getEntryForSlot(dayIdx, hour);
                                    if (entry) {
                                        const colorClass = getSectionColor(entry.sectionId);
                                        return (
                                            <div key={`${hour}-${dayIdx}`} className="p-2 h-full flex flex-col">
                                                <div 
                                                    onClick={() => {
                                                        if (user?.role === Role.TEACHER || user?.role === Role.ORG_MANAGER || user?.role === Role.ORG_ADMIN) {
                                                            const closestDate = getClosestDateForWeekday(entry.day);
                                                            router.push(`/attendance/${entry.sectionId}?scheduleId=${entry.scheduleId}&date=${closestDate}`);
                                                        }
                                                    }}
                                                    className={`flex-1 p-3 rounded-xl border ${colorClass} shadow-sm group hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between overflow-hidden relative cursor-pointer`}
                                                >
                                                    <div className="absolute -right-2 -top-2 opacity-5 scale-150 rotate-12">
                                                        <Clock className="w-16 h-16" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{entry.sectionName}</div>
                                                        <div className="text-xs font-black uppercase italic tracking-tighter leading-tight wrap-break-word">{entry.courseName}</div>
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-current/10 pt-2">
                                                        <div className="flex items-center gap-1 opacity-70">
                                                            <MapPin className="w-2.5 h-2.5" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[60px]">{entry.room || 'TBD'}</span>
                                                        </div>
                                                        <span className="text-[9px] font-black opacity-40 italic">{entry.startTime}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={`${hour}-${dayIdx}`} className="p-2 h-full group">
                                            <div className="flex-1 rounded-xl border border-dashed border-border/30 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity bg-muted/2 shadow-inner">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">BREAK</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
