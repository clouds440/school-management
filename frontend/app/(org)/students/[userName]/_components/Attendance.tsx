'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar as CalendarIcon, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';

export default function Attendance() {
    const [search, setSearch] = useState('');
    const [attendanceData] = useState([
        { date: '2026-03-14', course: 'Mathematics 101', status: 'present' },
        { date: '2026-03-13', course: 'Physics 201', status: 'present' },
        { date: '2026-03-12', course: 'English Literature', status: 'absent' },
        { date: '2026-03-11', course: 'Mathematics 101', status: 'late' },
        { date: '2026-03-10', course: 'Physics 201', status: 'present' },
    ]);

    const filteredAttendance = attendanceData.filter(log =>
        log.course.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-16 px-4 sm:px-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter leading-none italic uppercase">Presence Audit</h1>
                    <p className="text-muted-foreground mt-3 font-bold max-w-md tracking-tight">Systematic presence summary for the current academic session.</p>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-6">
                    <div className="grid grid-cols-3 gap-6 w-full md:w-auto">
                        <Card padding="md" className="flex flex-col items-center text-center shadow-xl shadow-black/5" delay={0}>
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-1">Present</p>
                            <p className="text-2xl font-black text-emerald-600 italic">94%</p>
                        </Card>
                        <Card padding="md" className="flex flex-col items-center text-center shadow-xl shadow-black/5" delay={100}>
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-1">Delayed</p>
                            <p className="text-2xl font-black text-amber-500 italic">2</p>
                        </Card>
                        <Card padding="md" className="flex flex-col items-center text-center shadow-xl shadow-black/5" delay={200}>
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-1">Absent</p>
                            <p className="text-2xl font-black text-red-500 italic">1</p>
                        </Card>
                    </div>

                    <div className="w-full md:w-64">
                        <SearchBar
                            placeholder="Filter ledger..."
                            value={search}
                            onChange={setSearch}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Log Section */}
                <Card accentColor="bg-indigo-500" padding="none" className="lg:col-span-2 overflow-hidden shadow-2xl border-0" delay={300}>
                    <CardHeader className="p-8 border-b border-border flex items-center justify-between mb-0">
                        <h3 className="text-xl font-black text-foreground italic uppercase tracking-tight">Attendance Ledger</h3>
                        <button className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-[0.2em] bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 transition-all active:scale-95 shadow-xs">Full History</button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border text-left">
                            {filteredAttendance.map((log, idx) => (
                                <div key={idx} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors group cursor-default">
                                    <div className="flex items-center gap-8">
                                        <div className="flex flex-col items-center justify-center bg-card w-16 h-16 rounded-2xl border border-border shadow-xl shadow-black/5 group-hover:scale-105 group-hover:shadow-primary/10 transition-all duration-500 text-center">
                                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-tighter mb-0.5">{new Date(log.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                            <span className="text-2xl font-black text-foreground leading-none italic">{new Date(log.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="font-black text-foreground text-lg group-hover:text-primary transition-colors italic leading-tight mb-1">{log.course}</p>
                                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                        </div>
                                    </div>
                                    <div>
                                        {log.status === 'present' && (
                                            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-xs">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Present</span>
                                            </div>
                                        )}
                                        {log.status === 'absent' && (
                                            <div className="flex items-center gap-2 bg-red-500/10 text-red-600 px-4 py-2 rounded-xl border border-red-500/20 shadow-xs">
                                                <XCircle className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Absent</span>
                                            </div>
                                        )}
                                        {log.status === 'late' && (
                                            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-xl border border-amber-500/20 shadow-xs">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Delayed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredAttendance.length === 0 && (
                                <div className="p-20 text-center">
                                    <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-widest">No matching records found</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Area */}
                <div className="space-y-10">
                    {/* Attendance Alerts */}
                    <Card padding="lg" className="border-0 shadow-2xl bg-card/50 backdrop-blur-md" accentColor="bg-red-500" delay={400}>
                        <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-8 italic flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            Critical Alerts
                        </h4>
                        <div className="space-y-4">
                            <div className="p-5 bg-red-500/5 rounded-2xl border border-red-500/20 flex items-start gap-5 text-left group/alert hover:bg-red-500/10 transition-colors">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-1 group-hover:animate-pulse" />
                                <div>
                                    <p className="text-[10px] font-black text-red-900 dark:text-red-400 uppercase tracking-widest leading-none mb-2">Unexcused Record</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">English Literature (Mar 12). Institutional justification required by EOD.</p>
                                </div>
                            </div>
                            <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/20 flex items-start gap-5 text-left group/alert hover:bg-amber-500/10 transition-colors">
                                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-1 group-hover:rotate-12 transition-transform" />
                                <div>
                                    <p className="text-[10px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest leading-none mb-2">Performance Risk</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">Aggregate attendance is near the 85% mandatory threshold.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Policy Sidebar */}
                    <Card className="bg-slate-950 border-0 shadow-2xl overflow-hidden relative group p-10" padding="none" delay={500}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-primary/20 transition-all duration-1000"></div>
                        <div className="relative z-10 text-left">
                            <div className="flex items-center gap-4 mb-6">
                                <CalendarIcon className="w-6 h-6 text-primary/60" />
                                <h4 className="text-xl font-black tracking-tight text-white uppercase italic">Compliance</h4>
                            </div>
                            <p className="text-muted-foreground/60 text-sm leading-relaxed font-medium mb-10">
                                A rigid minimum of 85% attendance is required per subject for exam qualification and academic progression.
                            </p>
                            <button className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] group-hover:text-primary transition-all flex items-center gap-2">
                                Institutional Handbook
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
