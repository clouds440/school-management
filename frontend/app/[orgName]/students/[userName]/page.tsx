'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
    BookOpen, Clock, Trophy, User, LayoutDashboard, Book, Mail, Settings, CheckCircle, Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    StudentPortalShell,
    StudentAssignment,
    StudentAnnouncement
} from '@/components/student/StudentPortalShell';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { Section, FinalGradeResponse } from '@/types';
import { useEffect, useState } from 'react';

export default function StudentOverviewPage() {
    const { user, token } = useAuth();
    const params = useParams();

    const [sections, setSections] = useState<Section[]>([]);
    const [finalGrades, setFinalGrades] = useState<FinalGradeResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [announcements] = useState<StudentAnnouncement[]>([
        { id: '1', title: 'Spring Semester Final Exams', content: 'The final exam schedule for the Spring 2026 semester has been posted. Please check your course pages for details.', date: '2026-03-18', author: 'Registrar' },
        { id: '2', title: 'Library Extended Hours', content: 'Starting next week, the central library will be open 24/7 for exam preparation.', date: '2026-03-15', author: 'Library Services' },
    ]);

    useEffect(() => {
        if (!token) return;

        setLoading(true);
        Promise.all([
            api.org.getSections(token, { my: true }),
            api.org.getOwnFinalGrades(token)
        ]).then(([sectionsData, gradesData]) => {
            setSections(sectionsData.data || []);
            setFinalGrades(gradesData || []);
        }).catch(err => {
            console.error('Failed to fetch student data:', err);
        }).finally(() => {
            setLoading(false);
        });
    }, [token]);

    if (!user) return null;

    const orgSlug = (params.orgSlug as string) || user.orgSlug || '';

    // Calculate Stats
    const totalCourses = sections.length;
    const averageGrade = finalGrades.length > 0
        ? (finalGrades.reduce((sum, g) => sum + (Number(g.finalPercentage) || 0), 0) / finalGrades.length).toFixed(1)
        : 'N/A';

    // For demo purposes, we'll use 92% attendance as a static value if not in backend yet
    const attendanceRate = '94%';

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <StudentPortalShell activeTab="overview">
            <div className="max-w-7xl mx-auto space-y-8 pb-10 px-4 sm:px-6">

                {/* Header Section with Quick Stats */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-3 italic">
                            Welcome, {user.name?.split(' ')[0] || 'Student'}
                        </h1>
                        <p className="text-slate-500 font-bold max-w-md">Your academic summary and upcoming activities at {user.orgName || 'your institution'}.</p>
                    </div>

                    <div className="hidden md:flex items-center gap-4 bg-white/50 backdrop-blur-sm px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Date</span>
                            <span className="text-sm font-bold text-slate-900">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Enrolled</p>
                        <p className="text-xl font-bold text-slate-900">{totalCourses} <span className="text-xs font-medium text-slate-400">Courses</span></p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Average</p>
                        <p className="text-xl font-bold text-indigo-600">{averageGrade}%</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Attendance</p>
                        <p className="text-xl font-bold text-emerald-600">{attendanceRate}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Course Progress Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-indigo-500" />
                                    Current Coursework
                                </h2>
                                <Link href={`/${orgSlug}/students/${user.userName}/courses`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                                    View Detailed Schedule →
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sections.map(sec => (
                                    <div key={sec.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group border-l-4 border-l-indigo-500 text-left">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{sec.course?.name}</p>
                                                <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{sec.name}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-semibold uppercase">{sec.room || 'TBD'}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[11px] font-bold">
                                                <span className="text-slate-500 uppercase tracking-tighter">Semester Completion</span>
                                                <span className="text-slate-900">75%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '75%' }}></div>
                                            </div>
                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                    <span className="text-[10px] font-medium text-slate-500">{sec.teachers?.[0]?.user?.name || 'Assigned Staff'}</span>
                                                </div>
                                                <Link
                                                    href={`/${orgSlug}/students/${user.userName}/courses/`}
                                                    className="p-1.5 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sections.length === 0 && (
                                    <div className="col-span-2 p-12 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                                        <Book className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm text-slate-500 font-medium">No active courses found in your record.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Recent Performance */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Academic Performance
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="divide-y divide-slate-100">
                                    {finalGrades.slice(0, 5).map(grade => (
                                        <div key={grade.sectionId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                                                    <span className="text-sm font-bold text-slate-700">{grade.letterGrade || 'A'}</span>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-slate-900">{grade.sectionName}</p>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-left">{grade.courseName}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-base font-bold text-slate-900">{grade.finalPercentage}%</p>
                                                <div className="w-20 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${(Number(grade.finalPercentage) || 0) > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${grade.finalPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {finalGrades.length === 0 && (
                                        <div className="p-10 text-center">
                                            <p className="text-sm text-slate-400 font-medium">Official grades for this semester haven't been published yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                        {/* Weekly Schedule Sneak Peek */}
                        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Next Up</h3>
                                <div className="p-1.5 bg-white/10 rounded-lg">
                                    <Clock className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {sections.slice(0, 2).map((sec, idx) => (
                                    <div key={sec.id} className="relative pl-4 border-l-2 border-indigo-500/50 text-left">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-0.5">
                                            {idx === 0 ? 'Today • 10:00 AM' : 'Tomorrow • 09:30 AM'}
                                        </p>
                                        <p className="text-sm font-bold text-white leading-tight">{sec.name}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{sec.room || 'Main Hall B'}</p>
                                    </div>
                                ))}
                                {sections.length === 0 && (
                                    <p className="text-xs text-slate-500 italic">No upcoming classes recorded.</p>
                                )}
                            </div>

                            <Link
                                href={`/${orgSlug}/students/${user.userName}/courses`}
                                className="block w-full mt-8 py-3 bg-white text-slate-900 text-center text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                View Calendar
                            </Link>
                        </div>

                        {/* Recent Announcements */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Announcements</h3>
                            <div className="space-y-6">
                                {announcements.map(ann => (
                                    <div key={ann.id} className="group text-left">
                                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors cursor-pointer leading-tight">
                                            {ann.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                            {ann.content}
                                        </p>
                                        <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase">
                                            <span>{ann.author}</span>
                                            <span>{new Date(ann.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StudentPortalShell>
    );
}