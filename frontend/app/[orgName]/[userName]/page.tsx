'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
    BookOpen, Clock, Trophy, User, LayoutDashboard, Book, Mail, Settings
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    StudentPortalShell,
    StudentCourse,
    StudentAssignment,
    StudentGrade,
    StudentAnnouncement
} from '@/components/student/StudentPortalShell';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/utils';

export default function StudentOverviewPage() {
    const { user } = useAuth();
    const params = useParams();

    // Dummy data state (replace with real API calls later)
    const [courses] = useState<StudentCourse[]>([
        { id: '1', name: 'Mathematics 101', teacher: 'Dr. Smith', schedule: 'Mon/Wed 10:00 AM', progress: 75 },
        { id: '2', name: 'Physics 201', teacher: 'Prof. Johnson', schedule: 'Tue/Thu 2:00 PM', progress: 40 },
        { id: '3', name: 'English Literature', teacher: 'Ms. Davis', schedule: 'Fri 9:00 AM', progress: 60 },
    ]);
    const [assignments] = useState<StudentAssignment[]>([
        { id: '1', title: 'Algebra Quiz', course: 'Mathematics 101', dueDate: '2025-03-20', status: 'pending' },
        { id: '2', title: 'Lab Report', course: 'Physics 201', dueDate: '2025-03-22', status: 'pending' },
        { id: '3', title: 'Essay Draft', course: 'English Literature', dueDate: '2025-03-18', status: 'submitted' },
    ]);
    const [recentGrades] = useState<StudentGrade[]>([
        { id: '1', course: 'Mathematics 101', assignment: 'Homework 5', score: '85/100', date: '2025-03-10' },
        { id: '2', course: 'Physics 201', assignment: 'Quiz 2', score: '92/100', date: '2025-03-08' },
        { id: '3', course: 'English Literature', assignment: 'Essay', score: '78/100', date: '2025-03-05' },
    ]);
    const [announcements] = useState<StudentAnnouncement[]>([
        { id: '1', title: 'School Closed on Friday', content: 'Due to maintenance, all classes are canceled.', date: '2025-03-15', author: 'Admin' },
        { id: '2', title: 'New Assignment Posted', content: 'Physics lab report due next week.', date: '2025-03-14', author: 'Prof. Johnson' },
    ]);

    if (!user) return null;

    const orgSlug = (params.orgSlug as string) || user.orgSlug || '';
    const nameSlug = user.name ? user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : 'dashboard';

    return (
        <StudentPortalShell activeTab="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Course Progress Grid */}
                    <div className="bg-card rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-black/5 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-primary flex items-center gap-3 italic uppercase">
                                <BookOpen className="w-6 h-6" /> CURRENT ENROLLMENTS
                            </h2>
                            <Link href={`/${orgSlug}/${nameSlug}/courses`} className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Full Catalog →</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {courses.map(course => (
                                <div key={course.id} className="p-6 bg-theme-bg border border-black/5 rounded-sm hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-black text-card-text group-hover:text-primary transition-colors">{course.name}</h3>
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-black">{course.progress}%</span>
                                    </div>
                                    <div className="space-y-2 mb-6">
                                        <p className="text-xs text-card-text/60 font-medium flex items-center gap-2 italic"><User className="w-3 h-3" /> {course.teacher}</p>
                                        <p className="text-xs text-card-text/60 font-medium flex items-center gap-2 italic"><Clock className="w-3 h-3" /> {course.schedule}</p>
                                    </div>
                                    <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Double Row: Action Items & Grades */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-card rounded-sm shadow-xl border border-black/5 p-8">
                            <h3 className="text-lg font-black text-card-text mb-6 flex items-center gap-2 uppercase tracking-tighter italic">
                                <Clock className="w-5 h-5 text-amber-500" /> Action Items
                            </h3>
                            <ul className="space-y-6">
                                {assignments.filter(a => a.status === 'pending').map(item => (
                                    <li key={item.id} className="flex items-center justify-between border-b border-black/5 pb-4 last:border-0 hover:bg-black/5 -mx-2 px-2 transition-colors rounded-sm">
                                        <div>
                                            <p className="font-bold text-card-text text-sm">{item.title}</p>
                                            <p className="text-[10px] text-card-text/40 font-black uppercase tracking-widest mt-1">{item.course}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-1">Due {new Date(item.dueDate).toLocaleDateString()}</span>
                                            <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse ml-auto"></div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-card rounded-sm shadow-xl border border-black/5 p-8">
                            <h3 className="text-lg font-black text-card-text mb-6 flex items-center gap-2 uppercase tracking-tighter italic">
                                <Trophy className="w-5 h-5 text-emerald-500" /> Recent Achievement
                            </h3>
                            <ul className="space-y-6">
                                {recentGrades.map(grade => (
                                    <li key={grade.id} className="flex items-center justify-between border-b border-black/5 pb-4 last:border-0">
                                        <div>
                                            <p className="font-bold text-card-text text-sm">{grade.assignment}</p>
                                            <p className="text-[10px] text-card-text/40 font-black uppercase tracking-widest mt-1">{grade.course}</p>
                                        </div>
                                        <span className="text-lg font-black text-primary italic underline-offset-4 underline">{grade.score}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    <div className="bg-card rounded-sm shadow-2xl border border-black/5 p-8 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="text-xl font-black text-card-text mb-8 relative z-10 italic uppercase tracking-tighter">Student Profile</h3>
                        <div className="flex items-center gap-5 mb-8 relative z-10">
                            <div className="relative w-20 h-20 rounded-sm bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-2xl border-4 border-white/50 overflow-hidden">
                                {user.avatarUrl ? (
                                    <Image
                                        src={getPublicUrl(user.avatarUrl, user.avatarUpdatedAt)}
                                        alt={user.name || 'User'}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    user.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="text-white">
                                <p className="font-black text-gray-900 text-xl leading-tight">{user.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{user.role?.replace('_', ' ')}</p>
                                <div className="inline-block mt-3 bg-black/5 px-3 py-1 rounded-full text-[9px] font-black text-gray-500 tracking-tighter uppercase whitespace-nowrap">ID: {user.id?.slice(0, 8)}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-black/5 pt-8 relative z-10">
                            <div className="text-center p-4 bg-primary/5 rounded-sm border border-primary/10">
                                <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-1">Attendance</p>
                                <p className="text-2xl font-black text-card-text italic">94<span className="text-xs opacity-40 ml-0.5">%</span></p>
                            </div>
                            <div className="text-center p-4 bg-emerald-50 rounded-sm border border-emerald-100">
                                <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mb-1">Current GPA</p>
                                <p className="text-2xl font-black text-card-text italic">3.8</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary rounded-sm shadow-[0_15px_40px_rgba(79,70,229,0.3)] p-8 text-primary-text relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-500"></div>
                        <h3 className="text-xl font-black mb-4 relative z-10 italic uppercase tracking-tighter">Announcements</h3>
                        <div className="space-y-6 relative z-10">
                            {announcements.map(item => (
                                <div key={item.id} className="border-l-4 border-white/30 pl-4 py-1">
                                    <p className="font-black text-sm">{item.title}</p>
                                    <p className="text-xs text-primary-text/60 mt-2 font-medium">By {item.author} • {new Date(item.date).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card rounded-sm shadow-xl border border-black/5 p-8">
                        <h3 className="text-lg font-black text-card-text mb-4 italic uppercase tracking-tighter flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-primary" /> Quick Links
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <Link href={`/${orgSlug}/${nameSlug}/courses`} className="flex items-center gap-3 p-4 bg-black/5 hover:bg-primary hover:text-white rounded-sm transition-all font-black text-[10px] uppercase tracking-widest group">
                                <Book className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Virtual Library
                            </Link>
                            <Link href={`/${orgSlug}/${nameSlug}/messages`} className="flex items-center gap-3 p-4 bg-black/5 hover:bg-primary hover:text-white rounded-sm transition-all font-black text-[10px] uppercase tracking-widest group">
                                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" /> Academic Inbox
                            </Link>
                            <Link href={`/${orgSlug}/${nameSlug}/settings`} className="flex items-center gap-3 p-4 bg-black/5 hover:bg-primary hover:text-white rounded-sm transition-all font-black text-[10px] uppercase tracking-widest group">
                                <Settings className="w-4 h-4 group-hover:spin transition-transform" /> Portal Settings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </StudentPortalShell>
    );
}