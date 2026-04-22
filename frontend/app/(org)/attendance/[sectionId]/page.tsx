'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ApiError, SectionAttendanceResponse, AttendanceStatus, Role, Section, RangeAttendanceResponse, SectionSchedule } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { Loading } from '@/components/ui/Loading';
import AttendanceSheet from '@/components/sections/AttendanceSheet';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CalendarDays, BarChart3, Edit3, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function SectionAttendancePage() {
    const { sectionId } = useParams() as { sectionId: string };
    const searchParams = useSearchParams();
    const { token, user } = useAuth();
    const { dispatch } = useGlobal();
    const router = useRouter();

    const paramDate = searchParams.get('date');
    const paramScheduleId = searchParams.get('scheduleId');

    const [section, setSection] = useState<Section | null>(null);
    const [date, setDate] = useState<string>(paramDate || new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>(paramScheduleId ? 'daily' : 'daily');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const [dailyData, setDailyData] = useState<SectionAttendanceResponse | null>(null);
    const [rangeData, setRangeData] = useState<RangeAttendanceResponse | null>(null);
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);

    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(paramScheduleId);
    const [adhocTime, setAdhocTime] = useState({ start: '09:00', end: '10:00' });

    const isStudent = user?.role === Role.STUDENT;
    const isReadOnly = isStudent;

    useEffect(() => {
        if (isStudent && viewMode !== 'monthly') {
            setViewMode('monthly');
        }
    }, [isStudent, viewMode]);

    const fetchSection = useCallback(async () => {
        if (!token) return;
        try {
            const data = await api.org.getSection(sectionId, token);
            setSection(data);

            // If no paramScheduleId, try to find first available for today
            if (!paramScheduleId && data.schedules) {
                const todayDay = new Date().getDay();
                const matched = data.schedules.find((schedule: SectionSchedule) => schedule.day === todayDay);
                if (matched) setSelectedScheduleId(matched.id);
            }
        } catch (error) {
            console.error('Failed to fetch section', error);
            router.push('/attendance');
        }
    }, [sectionId, token, router, paramScheduleId]);

    const fetchDailyAttendance = useCallback(async () => {
        if (!token || !date || viewMode !== 'daily') return;
        setFetching(true);
        try {
            const data = await api.org.getSectionAttendance(sectionId, date, token, selectedScheduleId || undefined);
            setDailyData(data);
        } catch (error: unknown) {
            dispatch({
                type: 'TOAST_ADD',
                payload: { message: (error as ApiError)?.message || 'Failed to load daily attendance', type: 'error' }
            });
        } finally {
            setFetching(false);
        }
    }, [sectionId, date, token, dispatch, viewMode, selectedScheduleId]);

    const fetchMonthlyAttendance = useCallback(async () => {
        if (!token || viewMode !== 'monthly') return;
        setFetching(true);
        try {
            const start = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
            const end = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
            const data = await api.org.getSectionAttendanceRange(sectionId, start, end, token);
            setRangeData(data);
        } catch (error: unknown) {
            dispatch({
                type: 'TOAST_ADD',
                payload: { message: (error as ApiError)?.message || 'Failed to load monthly attendance', type: 'error' }
            });
        } finally {
            setFetching(false);
        }
    }, [sectionId, currentMonth, currentYear, token, dispatch, viewMode]);

    useEffect(() => { fetchSection(); }, [fetchSection]);
    useEffect(() => { fetchDailyAttendance(); }, [fetchDailyAttendance]);
    useEffect(() => { fetchMonthlyAttendance(); }, [fetchMonthlyAttendance]);

    const handleSaveRecords = async (records: { studentId: string; status: AttendanceStatus }[]) => {
        if (!token || !dailyData) return;
        setSaving(true);
        try {
            let sessionId = dailyData.sessionId;
            if (!sessionId) {
                const sessionResponse = await api.org.createAttendanceSession(
                    sectionId,
                    date,
                    token,
                    selectedScheduleId || undefined,
                    !selectedScheduleId ? adhocTime.start : undefined,
                    !selectedScheduleId ? adhocTime.end : undefined
                );
                sessionId = sessionResponse.id;
            }
            await api.org.markAttendance(sessionId as string, records, token);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Attendance saved successfully', type: 'success' } });
            fetchDailyAttendance();
        } catch (error: unknown) {
            dispatch({
                type: 'TOAST_ADD',
                payload: { message: (error as ApiError)?.message || 'Failed to save attendance', type: 'error' }
            });
        } finally {
            setSaving(false);
        }
    };

    const handleMonthChange = (dir: 'prev' | 'next') => {
        if (dir === 'prev') {
            if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(prev => prev - 1);
            } else {
                setCurrentMonth(prev => prev - 1);
            }
        } else {
            if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(prev => prev + 1);
            } else {
                setCurrentMonth(prev => prev + 1);
            }
        }
    };

    if (!user || (user.role !== Role.TEACHER && user.role !== Role.ORG_MANAGER && user.role !== Role.ORG_ADMIN && user.role !== Role.STUDENT)) return null;

    const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long' });

    const getDayOfWeek = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).getDay();
    };

    return (
        <div className="flex flex-col h-full w-full space-y-6 pb-12">
            <div className="bg-card/80 backdrop-blur-2xl rounded-lg shadow-xl border border-border p-6 overflow-hidden">
                <Link href="/attendance" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Sections
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{section?.course?.name || 'COURSE'}</span>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-foreground">{section?.name || 'Loading Section...'}</h1>
                        <div className="flex items-center gap-2 mt-2">
                            {!isStudent && (
                                <Button
                                    variant={viewMode === 'daily' ? 'primary' : 'secondary'}
                                    icon={Edit3}
                                    onClick={() => setViewMode('daily')}
                                    className="text-[10px] font-black uppercase"
                                >
                                    Marking Mode
                                </Button>
                            )}
                            <Button
                                variant={viewMode === 'monthly' ? 'primary' : 'secondary'}
                                icon={BarChart3}
                                onClick={() => setViewMode('monthly')}
                                className="text-[10px] font-black uppercase"
                            >
                                Overview Mode
                            </Button>
                        </div>
                    </div>

                    <div className="w-full lg:w-auto bg-muted/20 p-4 rounded-xl border border-border grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-center gap-6">
                        {viewMode === 'daily' ? (
                            <>
                                <div className="flex items-center gap-4">
                                    <Label htmlFor="datePicker" className="whitespace-nowrap font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-primary" /> Target Date:
                                    </Label>
                                    <Input
                                        id="datePicker"
                                        type="date"
                                        value={date}
                                        onChange={(e) => {
                                            setDate(e.target.value);
                                            // Reset selected slot when date changes to first available for that day
                                            if (section?.schedules) {
                                                const day = getDayOfWeek(e.target.value);
                                                const matches = section.schedules.filter((schedule: SectionSchedule) => schedule.day === day);
                                                setSelectedScheduleId(matches.length > 0 ? matches[0].id : null);
                                            }
                                        }}
                                        className="bg-transparent min-w-[150px] text-xs font-bold"
                                    />
                                </div>
                                <div className="flex items-center gap-4 border-l border-border/50 pl-6 ml-6 md:ml-0 md:pl-0 md:border-l-0 lg:border-l lg:pl-6 lg:ml-6">
                                    <Label className="whitespace-nowrap font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" /> Time Slot:
                                    </Label>
                                    <CustomSelect
                                        value={selectedScheduleId || 'adhoc'}
                                        onChange={(val) => setSelectedScheduleId(val === 'adhoc' ? null : val)}
                                        options={[
                                            ...(section?.schedules?.filter((schedule: SectionSchedule) => schedule.day === getDayOfWeek(date)) || []).map((schedule: SectionSchedule) => ({
                                                value: schedule.id,
                                                label: `${schedule.startTime} - ${schedule.endTime} (${schedule.room || 'Main Room'})`
                                            })),
                                            { value: 'adhoc', label: 'Ad-hoc Session' }
                                        ]}
                                        className="min-w-[200px]"
                                    />
                                </div>
                                {!selectedScheduleId && (
                                    <div className="flex items-center gap-2 border-l border-border/50 pl-6 ml-6 animate-in fade-in slide-in-from-left-2">
                                        <Input
                                            type="time"
                                            value={adhocTime.start}
                                            onChange={(e) => setAdhocTime(prev => ({ ...prev, start: e.target.value }))}
                                            className="h-8 w-[100px] text-xs font-bold bg-transparent border-border"
                                        />
                                        <span className="text-[10px] font-black opacity-30 uppercase tracking-tighter">to</span>
                                        <Input
                                            type="time"
                                            value={adhocTime.end}
                                            onChange={(e) => setAdhocTime(prev => ({ ...prev, end: e.target.value }))}
                                            className="h-8 w-[100px] text-xs font-bold bg-transparent border-border"
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Label className="whitespace-nowrap font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-primary" /> Display Month:
                                </Label>
                                <div className="flex items-center gap-2 bg-card rounded-lg p-1 border border-border">
                                    <Button variant="secondary" icon={ChevronLeft} className="h-8 w-8" onClick={() => handleMonthChange('prev')} />
                                    <span className="text-xs font-black uppercase tracking-tighter min-w-[100px] text-center">
                                        {monthName} {currentYear}
                                    </span>
                                    <Button variant="secondary" icon={ChevronRight} className="h-8 w-8" onClick={() => handleMonthChange('next')} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {fetching ? (
                <div className="flex justify-center p-20 bg-card/50 rounded-xl border border-border backdrop-blur-sm"><Loading size="lg" /></div>
            ) : viewMode === 'daily' ? (
                dailyData && <AttendanceSheet students={dailyData.students} date={dailyData.date} onSave={handleSaveRecords} isSaving={saving} mode="daily" readOnly={isReadOnly} />
            ) : (
                rangeData && <AttendanceSheet students={[]} mode="monthly" rangeData={rangeData} readOnly={isReadOnly} />
            )}
        </div>
    );
}
