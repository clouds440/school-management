'use client';

import { useState } from 'react';
import {
    StudentPortalShell
} from '@/components/student/StudentPortalShell';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function StudentAttendancePage() {
    const [attendanceData] = useState([
        { date: '2025-03-14', course: 'Mathematics 101', status: 'present' },
        { date: '2025-03-13', course: 'Physics 201', status: 'present' },
        { date: '2025-03-12', course: 'English Literature', status: 'absent' },
        { date: '2025-03-11', course: 'Mathematics 101', status: 'late' },
        { date: '2025-03-10', course: 'Physics 201', status: 'present' },
    ]);

    return (
        <StudentPortalShell activeTab="attendance">
            <div className="space-y-8">
                <div className="bg-card p-6 rounded-sm shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-primary flex items-center gap-3 italic uppercase">
                            Attendance Tracking
                        </h2>
                        <p className="text-xs text-card-text/40 font-bold uppercase tracking-widest mt-1">Academic Year 2025-2026</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-sm text-center min-w-[120px]">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Present</p>
                            <p className="text-2xl font-black text-emerald-700 italic">94%</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-sm text-center min-w-[120px]">
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Late Instances</p>
                            <p className="text-2xl font-black text-amber-700 italic">2</p>
                        </div>
                        <div className="bg-red-50 border border-red-100 p-4 rounded-sm text-center min-w-[120px]">
                            <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Total Absences</p>
                            <p className="text-2xl font-black text-red-700 italic">1</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-card rounded-sm shadow-xl border border-black/5 overflow-hidden">
                        <div className="p-6 border-b border-black/5 flex items-center justify-between">
                            <h3 className="font-black text-card-text italic uppercase tracking-tighter">Recent Logs</h3>
                            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View Calendar View</button>
                        </div>
                        <div className="divide-y divide-black/5">
                            {attendanceData.map((log, idx) => (
                                <div key={idx} className="p-6 flex items-center justify-between hover:bg-black/5 transition-colors group">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-center justify-center bg-theme-bg w-14 h-14 rounded-sm border border-black/5 group-hover:bg-white transition-colors">
                                            <span className="text-[10px] font-black text-card-text/40 uppercase tracking-tighter">{new Date(log.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                            <span className="text-xl font-black text-card-text italic">{new Date(log.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="font-black text-card-text group-hover:text-primary transition-colors">{log.course}</p>
                                            <p className="text-xs text-card-text/60 font-bold italic">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {log.status === 'present' && (
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Present</span>
                                            </div>
                                        )}
                                        {log.status === 'absent' && (
                                            <div className="flex items-center gap-2 text-red-500 font-black">
                                                <XCircle className="w-5 h-5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Absent</span>
                                            </div>
                                        )}
                                        {log.status === 'late' && (
                                            <div className="flex items-center gap-2 text-amber-500 font-bold">
                                                <Clock className="w-5 h-5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Late</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-card p-8 rounded-sm shadow-xl border border-black/5 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                            <h4 className="text-lg font-black text-card-text mb-6 italic uppercase tracking-tighter">Attendance Alerts</h4>
                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-sm flex items-start gap-4">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-red-800 uppercase tracking-widest mb-1">Absence Alert</p>
                                        <p className="text-xs text-red-700/80 font-bold italic">You missed English Literature on Mar 12. Please provide an excuse letter.</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-sm flex items-start gap-4">
                                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Tardy Notice</p>
                                        <p className="text-xs text-amber-700/80 font-bold italic">You have been marked late twice this month.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary p-8 rounded-sm text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform"></div>
                            <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4 relative z-10">Attendance Policy</h4>
                            <p className="text-primary-text/60 text-xs font-medium leading-relaxed relative z-10">
                                Students are required to maintain at least 85% attendance to be eligible for final examinations. For excused absences, please notify the office within 48 hours.
                            </p>
                            <button className="mt-8 text-[10px] font-black uppercase tracking-widest border-b-2 border-white/20 hover:border-white transition-all relative z-10 underline-offset-8">Read Student Handbook →</button>
                        </div>
                    </div>
                </div>
            </div>
        </StudentPortalShell>
    );
}
