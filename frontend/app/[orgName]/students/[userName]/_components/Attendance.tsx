'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';

export default function Attendance() {
    const [attendanceData] = useState([
        { date: '2026-03-14', course: 'Mathematics 101', status: 'present' },
        { date: '2026-03-13', course: 'Physics 201', status: 'present' },
        { date: '2026-03-12', course: 'English Literature', status: 'absent' },
        { date: '2026-03-11', course: 'Mathematics 101', status: 'late' },
        { date: '2026-03-10', course: 'Physics 201', status: 'present' },
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10 px-4 sm:px-6">
            
            {/* Header Stats Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Attendance Record</h1>
                    <p className="text-slate-500 mt-1">Status summary for Spring Semester 2026.</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Present</p>
                        <p className="text-xl font-bold text-emerald-600 italic">94%</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Late</p>
                        <p className="text-xl font-bold text-amber-500 italic">2</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Absent</p>
                        <p className="text-xl font-bold text-red-500 italic">1</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Log Section */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm border-t-4 border-t-indigo-500">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Recent Attendance Logs</h3>
                        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-tight">View Full History</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {attendanceData.map((log, idx) => (
                            <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center justify-center bg-slate-50 w-14 h-14 rounded-xl border border-slate-100 shadow-sm group-hover:scale-105 transition-transform">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(log.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-xl font-bold text-slate-900 leading-none">{new Date(log.date).getDate()}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{log.course}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {log.status === 'present' && (
                                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">Present</span>
                                        </div>
                                    )}
                                    {log.status === 'absent' && (
                                        <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg">
                                            <XCircle className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">Absent</span>
                                        </div>
                                    )}
                                    {log.status === 'late' && (
                                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">Late</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Area */}
                <div className="space-y-8">
                    {/* Attendance Alerts */}
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm border-l-4 border-l-red-500">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Attendance Alerts</h4>
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 flex items-start gap-4 text-left">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-bold text-red-900 uppercase tracking-tight">Unexcused Absence</p>
                                    <p className="text-xs text-red-700/80 leading-relaxed mt-1 font-medium">English Literature (Mar 12). Please submit justification.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-4 text-left">
                                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-bold text-amber-900 uppercase tracking-tight">Performance Advisory</p>
                                    <p className="text-xs text-amber-700/80 leading-relaxed mt-1 font-medium">Aggregate attendance is near the 85% requirement.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Policy Sidebar */}
                    <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
                        <div className="relative z-10 text-left">
                            <div className="flex items-center gap-3 mb-4">
                                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                                <h4 className="text-base font-bold tracking-tight">Attendance Policy</h4>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                A minimum of 85% attendance is required per subject for exam eligibility and academic progression.
                            </p>
                            <button className="mt-6 text-[11px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">
                                View Handbook →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
