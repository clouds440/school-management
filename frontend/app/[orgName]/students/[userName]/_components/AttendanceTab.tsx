'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';

export default function AttendanceTab() {
    const [attendanceData] = useState([
        { date: '2026-03-14', course: 'Mathematics 101', status: 'present' },
        { date: '2026-03-13', course: 'Physics 201', status: 'present' },
        { date: '2026-03-12', course: 'English Literature', status: 'absent' },
        { date: '2026-03-11', course: 'Mathematics 101', status: 'late' },
        { date: '2026-03-10', course: 'Physics 201', status: 'present' },
    ]);

    return (
        <div className="space-y-8 mt-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="text-left">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Attendance Tracker</h2>
                    <p className="text-slate-500 mt-1 font-bold text-[10px] uppercase tracking-widest leading-none">Official presence verify for Spring Semester 2026</p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm min-w-[100px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Present</p>
                        <p className="text-xl font-black text-emerald-600 italic">94%</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm min-w-[100px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Late</p>
                        <p className="text-xl font-black text-amber-500 italic">2</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm min-w-[100px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Absent</p>
                        <p className="text-xl font-black text-red-500 italic">1</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm border-t-4 border-t-primary text-left">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic leading-none">Roll Call History</h3>
                        <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-tight">Full Archive →</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {attendanceData.map((log, idx) => (
                            <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center justify-center bg-white w-14 h-14 rounded-sm border border-slate-100 shadow-sm group-hover:border-primary transition-all">
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter mb-0.5">{new Date(log.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
                                        <span className="text-xl font-black italic text-slate-900 leading-none">{new Date(log.date).getDate()}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors leading-none mb-1">{log.course}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {log.status === 'present' && (
                                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-sm border border-emerald-100">
                                            <CheckCircle className="w-3 h-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Present</span>
                                        </div>
                                    )}
                                    {log.status === 'absent' && (
                                        <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-sm border border-red-100">
                                            <XCircle className="w-3 h-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Absent</span>
                                        </div>
                                    )}
                                    {log.status === 'late' && (
                                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-sm border border-amber-100">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Late</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-sm border-l-4 border-l-red-500 text-left">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Academic Alerts</h4>
                        <div className="space-y-6">
                            <div className="p-4 bg-red-50/50 rounded-sm border border-red-100 flex items-start gap-4">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-red-900 uppercase tracking-widest">ACTION REQUIRED</p>
                                    <p className="text-xs text-red-700 font-bold leading-relaxed mt-2 uppercase tracking-tight italic">Missing Justification: Mar 12 Absence</p>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-50/50 rounded-sm border border-amber-100 flex items-start gap-4">
                                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">MANDATORY ADVISORY</p>
                                    <p className="text-xs text-amber-700 font-bold leading-relaxed mt-2 uppercase tracking-tight italic">Attendance near 85% requirement.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-sm text-white shadow-xl relative overflow-hidden group text-left">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                        <div className="relative z-10 text-left">
                            <div className="flex items-center gap-3 mb-6">
                                <CalendarIcon className="w-5 h-5 text-primary" />
                                <h4 className="text-sm font-black italic uppercase tracking-tighter">Attendance Policy</h4>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed font-bold uppercase tracking-wide italic">
                                85% Minimum Subject Attendance required for Exam eligibility.
                            </p>
                            <button className="mt-8 text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:text-white transition-all underline underline-offset-8">
                                HANDBOOK →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
