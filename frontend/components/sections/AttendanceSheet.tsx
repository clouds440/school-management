'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SectionAttendanceStudent, AttendanceStatus, RangeAttendanceResponse, Role } from '@/types';
import { Button } from '@/components/ui/Button';
import { Check, X, Clock, FileWarning, Save, CheckSquare, Calendar, User, Activity } from 'lucide-react';

interface AttendanceSheetProps {
    students: SectionAttendanceStudent[];
    date?: string;
    readOnly?: boolean;
    onSave?: (records: { studentId: string; status: AttendanceStatus }[]) => void;
    isSaving?: boolean;
    mode?: 'daily' | 'monthly';
    rangeData?: RangeAttendanceResponse;
}

export default function AttendanceSheet({
    students: initialStudents,
    date,
    readOnly: forcedReadOnly,
    onSave,
    isSaving,
    mode = 'daily',
    rangeData
}: AttendanceSheetProps) {
    const { user } = useAuth();
    const isStudent = user?.role === Role.STUDENT;
    const readOnly = forcedReadOnly || isStudent;
    
    const students = initialStudents;

    const displayRangeStudents = (mode === 'monthly' && rangeData)
        ? rangeData.students
        : [];

    const dailySeedKey = useMemo(
        () => students.map((student) => `${student.studentId}:${student.status ?? 'null'}`).join('|'),
        [students],
    );

    const dailyInitialRecords = useMemo(() => {
        const init: Record<string, AttendanceStatus | null> = {};
        students.forEach((student) => {
            init[student.studentId] = student.status;
        });
        return init;
    }, [students]);

    const [draft, setDraft] = useState<{
        seedKey: string;
        values: Record<string, AttendanceStatus | null>;
        dirty: boolean;
    }>({
        seedKey: '',
        values: {},
        dirty: false,
    });

    const localRecords = mode === 'daily' && draft.seedKey === dailySeedKey
        ? { ...dailyInitialRecords, ...draft.values }
        : dailyInitialRecords;
    const hasChanges = mode === 'daily' && draft.seedKey === dailySeedKey && draft.dirty;

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        if (readOnly) return;
        setDraft((prev) => ({
            seedKey: dailySeedKey,
            values: {
                ...(prev.seedKey === dailySeedKey ? prev.values : {}),
                [studentId]: status,
            },
            dirty: true,
        }));
    };

    const handleMarkAllPresent = () => {
        if (readOnly) return;
        const out: Record<string, AttendanceStatus | null> = {};
        students.forEach(s => {
            out[s.studentId] = AttendanceStatus.PRESENT;
        });
        setDraft({
            seedKey: dailySeedKey,
            values: out,
            dirty: true,
        });
    };

    const handleSave = () => {
        if (!onSave) return;
        const recordsToSave = students.map(s => ({
            studentId: s.studentId,
            status: localRecords[s.studentId] || AttendanceStatus.PRESENT
        }));
        onSave(recordsToSave);
        setDraft((prev) => ({
            ...prev,
            seedKey: dailySeedKey,
            dirty: false,
        }));
    };

    const getStatusIcon = (status: AttendanceStatus | null, size = "w-3.5 h-3.5") => {
        switch (status) {
            case AttendanceStatus.PRESENT: return <Check className={`${size} text-emerald-600 dark:text-emerald-400`} />;
            case AttendanceStatus.ABSENT: return <X className={`${size} text-red-600 dark:text-red-400`} />;
            case AttendanceStatus.LATE: return <Clock className={`${size} text-amber-600 dark:text-amber-400`} />;
            case AttendanceStatus.EXCUSED: return <FileWarning className={`${size} text-blue-600 dark:text-blue-400`} />;
            default: return <span className="text-muted-foreground/40 text-xs">-</span>;
        }
    };

    const getStatusButtonClass = (isActive: boolean, type: AttendanceStatus) => {
        if (!isActive) return "bg-background hover:bg-muted/50 text-muted-foreground border-border shadow-sm";
        switch (type) {
            case AttendanceStatus.PRESENT: return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20";
            case AttendanceStatus.ABSENT: return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40 shadow-sm ring-1 ring-red-500/20";
            case AttendanceStatus.LATE: return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-sm ring-1 ring-amber-500/20";
            case AttendanceStatus.EXCUSED: return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40 shadow-sm ring-1 ring-blue-500/20";
            default: return "";
        }
    };

    const sessionById = useMemo(
        () => new Map((rangeData?.sessions || []).map((session) => [session.id, session] as const)),
        [rangeData],
    );

    const groupedSessionDates = useMemo(() => {
        if (!rangeData) return [];

        const groups = new Map<string, typeof rangeData.sessions>();
        rangeData.sessions.forEach((session) => {
            const dateKey = String(session.date).slice(0, 10);
            const existing = groups.get(dateKey) || [];
            existing.push(session);
            groups.set(dateKey, existing);
        });

        return Array.from(groups.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, sessions]) => ({
                dateKey,
                sessions: sessions.sort((a, b) => {
                    const aTime = a.startTime || a.schedule?.startTime || '99:99';
                    const bTime = b.startTime || b.schedule?.startTime || '99:99';
                    return aTime.localeCompare(bTime);
                }),
            }));
    }, [rangeData]);

    const getSessionLabel = (session: NonNullable<RangeAttendanceResponse['sessions']>[number]) => {
        const start = session.startTime || session.schedule?.startTime;
        const end = session.endTime || session.schedule?.endTime;
        if (start && end) {
            // Format to show cleaner time
            const formatTime = (t: string) => t.slice(0, 5);
            return `${formatTime(start)} - ${formatTime(end)}`;
        }
        if (session.isAdhoc) return 'Ad-hoc';
        return 'Session';
    };

    // Helper to get readable session type badge
    const getSessionTypeBadge = (isAdhoc: boolean) => {
        return isAdhoc 
            ? <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">adhoc</span>
            : <span className="text-[9px] font-black uppercase tracking-wider bg-primary/15 text-primary/80 px-1.5 py-0.5 rounded-full">scheduled</span>;
    };

    if (mode === 'monthly' && rangeData) {
        return (
            <div className="flex flex-col border border-border rounded-2xl overflow-hidden bg-card shadow-lg">
                <div className="overflow-x-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-primary/30">
                    <table className="w-full text-left text-sm border-separate border-spacing-0">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-primary/5 border-b border-border">
                                <th className="sticky left-0 z-30 px-3 py-4 font-black uppercase tracking-widest text-[10px] text-primary/80 bg-primary/5 w-12 text-center rounded-tl-xl">
                                    #
                                </th>
                                <th className="sticky left-12 z-30 px-4 py-4 font-black uppercase tracking-widest text-[10px] text-primary/80 bg-primary/5 border-l border-primary/10 min-w-55 rounded-tr-xl">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3" />
                                        <span>Student</span>
                                    </div>
                                </th>
                                {groupedSessionDates.map(({ dateKey, sessions }) => (
                                    <th key={dateKey} className="px-3 py-4 font-black uppercase tracking-widest text-[10px] text-primary/80 text-center bg-primary/5 border-l border-primary/10 min-w-40 align-top">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-1 text-sm font-bold text-primary">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(dateKey).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</span>
                                            </div>
                                            <span className="text-[9px] opacity-70 font-mono">{new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                            <div className="mt-1 flex flex-wrap justify-center gap-1">
                                                {sessions.map((session) => (
                                                    <span
                                                        key={session.id}
                                                        className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                                                            session.isAdhoc ? 'bg-amber-500/20 text-amber-600' : 'bg-primary/20 text-primary/80'
                                                        }`}
                                                    >
                                                        {getSessionLabel(session).replace(/[—–]/g, '-')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-primary/80 bg-primary/5 border-l border-primary/20 text-center min-w-35">
                                    <div className="flex items-center justify-center gap-1">
                                        <Activity className="w-3 h-3" />
                                        <span>Analysis</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {displayRangeStudents.map((student, sIdx) => {
                                const recordsBySessionId = new Map(
                                    student.records.map((record) => [record.sessionId, record] as const),
                                );

                                const officialRecords = student.records.filter((record) => {
                                    const session = sessionById.get(record.sessionId);
                                    return session && !session.isAdhoc && record.status !== null;
                                });
                                
                                const markedRecords = student.records.filter(r => r.status !== null);

                                const officialTotal = officialRecords.length;
                                const present = officialRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
                                const absent = officialRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
                                const late = officialRecords.filter(r => r.status === AttendanceStatus.LATE).length;
                                const excused = officialRecords.filter(r => r.status === AttendanceStatus.EXCUSED).length;

                                const officialPresent = present + late;
                                const officialPercentage = officialTotal > 0 ? Math.round((officialPresent / officialTotal) * 100) : 100;

                                const overallTotal = markedRecords.length;
                                const overallPresent = markedRecords.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
                                const overallPercentage = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 100;

                                return (
                                    <tr key={student.studentId} className="group hover:bg-muted/5 transition-all duration-150">
                                        <td className="sticky left-0 z-10 px-3 py-4 text-center font-bold text-muted-foreground/60 bg-card group-hover:bg-muted/5 border-r border-border/30">
                                            {sIdx + 1}
                                        </td>
                                        <td className="sticky left-12 z-10 px-4 py-4 border-l border-border/50 bg-card group-hover:bg-muted/5">
                                            <div className="font-bold text-foreground line-clamp-1">{student.name}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mt-0.5">Roll: {student.rollNumber || student.registrationNumber}</div>
                                        </td>
                                        {groupedSessionDates.map(({ dateKey, sessions }) => (
                                            <td key={dateKey} className="px-3 py-3 border-l border-border/30 align-top bg-card">
                                                {/* STACKED SESSIONS VERTICALLY */}
                                                <div className="flex flex-col gap-2 w-full min-w-32.5">
                                                    {sessions.map((session) => {
                                                        const record = recordsBySessionId.get(session.id);
                                                        const sessionStatus = record?.status || null;
                                                        const isAdhoc = session.isAdhoc;
                                                        
                                                        return (
                                                            <div
                                                                key={session.id}
                                                                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 transition-all ${
                                                                    isAdhoc
                                                                        ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
                                                                        : 'border-border/70 bg-muted/10 hover:bg-muted/20'
                                                                }`}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-bold leading-tight font-mono">
                                                                        {getSessionLabel(session)}
                                                                    </span>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        {getSessionTypeBadge(isAdhoc!)}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-center min-w-8">
                                                                    {getStatusIcon(sessionStatus, "w-4 h-4")}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {sessions.length === 0 && (
                                                        <div className="text-center text-muted-foreground/40 text-[10px] py-2 italic">No sessions</div>
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 border-l border-primary/20 bg-primary/5">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-background/80 shadow-sm" title="Official sessions (scheduled)">
                                                        <span className="text-[8px] font-black text-muted-foreground/60 uppercase">Official</span>
                                                        <span className="text-sm font-black">{officialTotal}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-black shadow-md">
                                                        {officialPercentage}%
                                                    </div>
                                                </div>
                                                {overallTotal > officialTotal && (
                                                    <div className="text-[9px] font-black opacity-50 flex items-center gap-1" title="Total including ad-hoc sessions">
                                                        <span>total</span>
                                                        <span className="font-mono">{overallPercentage}%</span>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-4 gap-2 w-full max-w-30 mt-1">
                                                    <div className="flex flex-col items-center bg-emerald-500/10 rounded-lg py-1">
                                                        <span className="text-[8px] font-black text-emerald-600 uppercase">P</span>
                                                        <span className="text-xs font-bold">{present}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center bg-red-500/10 rounded-lg py-1">
                                                        <span className="text-[8px] font-black text-red-600 uppercase">A</span>
                                                        <span className="text-xs font-bold">{absent}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center bg-amber-500/10 rounded-lg py-1">
                                                        <span className="text-[8px] font-black text-amber-600 uppercase">L</span>
                                                        <span className="text-xs font-bold">{late}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center bg-blue-500/10 rounded-lg py-1">
                                                        <span className="text-[8px] font-black text-blue-600 uppercase">E</span>
                                                        <span className="text-xs font-bold">{excused}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {rangeData.students.length === 0 && (
                                <tr>
                                    <td colSpan={groupedSessionDates.length + 3} className="px-6 py-16 text-center text-muted-foreground italic bg-muted/10">
                                        <div className="flex flex-col items-center gap-2">
                                            <User className="w-8 h-8 opacity-20" />
                                            <span>No enrollment data available for this period.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Daily mode with responsive improvements
    return (
        <div className="flex flex-col border border-border rounded-2xl overflow-hidden bg-card shadow-lg">
            {!readOnly && (
                <div className="p-4 bg-muted/10 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-primary" />
                            Mark Attendance
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                            {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Button
                            variant="success"
                            onClick={handleMarkAllPresent}
                            icon={CheckSquare}
                            className="bg-background text-xs font-bold shadow-sm hover:shadow-md transition-all"
                        >
                            Mark All Present
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            isLoading={isSaving}
                            icon={Save}
                            className="text-xs font-bold shadow-sm"
                        >
                            Save Attendance
                        </Button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-primary/5 border-b border-border">
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-primary/70 w-12 text-center">#</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-primary/70 border-l border-primary/10">
                                Student
                            </th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-primary/70 text-center border-l border-primary/10">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-16 text-center text-muted-foreground italic">
                                    <div className="flex flex-col items-center gap-2">
                                        <User className="w-8 h-8 opacity-20" />
                                        <span>No students enrolled in this section.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            students.map((student, idx) => {
                                const status = localRecords[student.studentId];
                                return (
                                    <tr key={student.studentId} className="group hover:bg-muted/5 transition-colors">
                                        <td className="px-4 py-4 text-center font-bold text-muted-foreground/60">
                                            {idx + 1}
                                        </td>
                                        <td className="px-6 py-4 border-l border-border/30">
                                            <div className="font-bold text-foreground">{student.name}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-mono mt-0.5">
                                                Roll: {student.rollNumber || student.registrationNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-l border-border/30 text-center">
                                            <div className="inline-flex flex-wrap justify-center gap-2">
                                                <button
                                                    disabled={readOnly}
                                                    onClick={() => handleStatusChange(student.studentId, AttendanceStatus.PRESENT)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${getStatusButtonClass(status === AttendanceStatus.PRESENT, AttendanceStatus.PRESENT)}`}
                                                    title="Present"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span className="hidden xs:inline">P</span>
                                                </button>
                                                <button
                                                    disabled={readOnly}
                                                    onClick={() => handleStatusChange(student.studentId, AttendanceStatus.ABSENT)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${getStatusButtonClass(status === AttendanceStatus.ABSENT, AttendanceStatus.ABSENT)}`}
                                                    title="Absent"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span className="hidden xs:inline">A</span>
                                                </button>
                                                <button
                                                    disabled={readOnly}
                                                    onClick={() => handleStatusChange(student.studentId, AttendanceStatus.LATE)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${getStatusButtonClass(status === AttendanceStatus.LATE, AttendanceStatus.LATE)}`}
                                                    title="Late"
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="hidden xs:inline">L</span>
                                                </button>
                                                <button
                                                    disabled={readOnly}
                                                    onClick={() => handleStatusChange(student.studentId, AttendanceStatus.EXCUSED)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${getStatusButtonClass(status === AttendanceStatus.EXCUSED, AttendanceStatus.EXCUSED)}`}
                                                    title="Excused"
                                                >
                                                    <FileWarning className="w-3.5 h-3.5" />
                                                    <span className="hidden xs:inline">E</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
