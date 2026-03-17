'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    GraduationCap, BookOpen, Clock, Calendar, Bell, Trophy, User, ShieldOff, Mail, XCircle, CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { BackButton } from '@/components/ui/BackButton';
import { OrgStatus, Organization } from '@/types';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/utils';

// Dummy data types
interface Course {
    id: string;
    name: string;
    teacher: string;
    schedule: string;
    progress: number;
    nextClass?: string;
}

interface Assignment {
    id: string;
    title: string;
    course: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded';
}

interface Grade {
    id: string;
    course: string;
    assignment: string;
    score: string;
    date: string;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: string;
}

export default function StudentPersonalizedDashboard() {
    const { user, token, loading } = useAuth();
    const params = useParams();
    const [orgName, setOrgName] = useState('Organization');
    const [orgStatus, setOrgStatus] = useState<string | null>(null);
    const [orgStatusMessage, setOrgStatusMessage] = useState<string | null>(null);
    const [userStatusMessage, setUserStatusMessage] = useState<string | null>(null);

    // Dummy data state (replace with real API calls later)
    const [courses, setCourses] = useState<Course[]>([
        { id: '1', name: 'Mathematics 101', teacher: 'Dr. Smith', schedule: 'Mon/Wed 10:00 AM', progress: 75 },
        { id: '2', name: 'Physics 201', teacher: 'Prof. Johnson', schedule: 'Tue/Thu 2:00 PM', progress: 40 },
        { id: '3', name: 'English Literature', teacher: 'Ms. Davis', schedule: 'Fri 9:00 AM', progress: 60 },
    ]);
    const [assignments, setAssignments] = useState<Assignment[]>([
        { id: '1', title: 'Algebra Quiz', course: 'Mathematics 101', dueDate: '2025-03-20', status: 'pending' },
        { id: '2', title: 'Lab Report', course: 'Physics 201', dueDate: '2025-03-22', status: 'pending' },
        { id: '3', title: 'Essay Draft', course: 'English Literature', dueDate: '2025-03-18', status: 'submitted' },
    ]);
    const [recentGrades, setRecentGrades] = useState<Grade[]>([
        { id: '1', course: 'Mathematics 101', assignment: 'Homework 5', score: '85/100', date: '2025-03-10' },
        { id: '2', course: 'Physics 201', assignment: 'Quiz 2', score: '92/100', date: '2025-03-08' },
        { id: '3', course: 'English Literature', assignment: 'Essay', score: '78/100', date: '2025-03-05' },
    ]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([
        { id: '1', title: 'School Closed on Friday', content: 'Due to maintenance, all classes are canceled.', date: '2025-03-15', author: 'Admin' },
        { id: '2', title: 'New Assignment Posted', content: 'Physics lab report due next week.', date: '2025-03-14', author: 'Prof. Johnson' },
    ]);

    useEffect(() => {
        if (!user || !token) return;

        api.org.getOrgData(token)
            .then((data: Organization) => {
                if (data?.name) setOrgName(data.name);
                if (data?.status) setOrgStatus(data.status);
                if (data?.statusHistory?.length) {
                    setOrgStatusMessage(data.statusHistory[data.statusHistory.length - 1].message);
                }
            })
            .catch(() => { });

        // Optionally fetch user-specific status message if your API provides it
        // e.g., api.user.getStatus(token).then(...)
        // For now, we'll simulate a user message if the user is suspended.
        if (user.status === 'SUSPENDED') {
            setUserStatusMessage('Your account has been temporarily suspended by the administration. Please contact the office for details.');
        } else if (user.status === 'ALUMNI') {
            setUserStatusMessage('You are marked as alumni. You can view your records but cannot access active courses.');
        }
    }, [user, token]);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) return null;

    // Helper to check if organization access is blocked
    const isOrgBlocked = orgStatus && orgStatus !== OrgStatus.APPROVED;

    // Determine which status message to show (org takes precedence)
    const renderStatusMessage = () => {
        if (isOrgBlocked) {
            switch (orgStatus) {
                case OrgStatus.PENDING:
                    return (
                        <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-white/40 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                            <div className="p-6 bg-yellow-50 rounded-full mb-6 relative">
                                <Clock className="w-20 h-20 text-yellow-500 animate-pulse" />
                                <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Organization Pending</h2>
                            <p className="text-gray-600 text-lg mb-8 font-medium">
                                Your school's registration is still being processed. Once approved, you'll be able to see your classes and grades here.
                            </p>
                            <div className="bg-yellow-100 text-yellow-800 px-10 py-5 rounded-sm font-black text-xl border border-yellow-200 w-full shadow-inner flex items-center justify-center gap-3">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                                Organization: Pending Verification
                            </div>
                        </div>
                    );
                case OrgStatus.REJECTED:
                    return (
                        <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-white/40 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                            <div className="p-6 bg-red-50 rounded-full mb-6">
                                <XCircle className="w-20 h-20 text-red-500" />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Organization Unavailable</h2>
                            <p className="text-gray-600 text-lg mb-8 font-medium">
                                The academic portal for your institution is currently unavailable. Please contact your school administration for further information.
                            </p>
                            {orgStatusMessage && (
                                <div className="bg-red-50 border border-red-100 p-6 rounded-sm mb-8 text-left w-full shadow-inner">
                                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Institutional Notice</p>
                                    <p className="text-red-700 font-medium italic">"{orgStatusMessage}"</p>
                                </div>
                            )}
                        </div>
                    );
                case OrgStatus.SUSPENDED:
                    return (
                        <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-orange-200 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                            <div className="p-6 bg-orange-50 rounded-full mb-6">
                                <ShieldOff className="w-20 h-20 text-orange-500" />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Organization Suspended</h2>
                            <p className="text-gray-600 text-lg mb-8 font-medium">
                                Your entire institution's access has been temporarily restricted. This affects all students and staff.
                            </p>
                        </div>
                    );
                default:
                    return null;
            }
        }

        // If org is approved but user has individual restrictions
        if (user.status === 'SUSPENDED') {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-orange-200 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                    <div className="p-6 bg-orange-50 rounded-full mb-6">
                        <ShieldOff className="w-20 h-20 text-orange-500" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Account Suspended</h2>
                    <p className="text-gray-600 text-lg mb-8 font-medium">
                        Your individual student account has been temporarily suspended by the administration.
                    </p>
                    {userStatusMessage && (
                        <div className="bg-orange-50 text-orange-800 p-6 rounded-sm border border-orange-100 w-full mb-8 text-left shadow-inner">
                            <p className="italic font-bold text-orange-900">{userStatusMessage}</p>
                        </div>
                    )}
                    <Link
                        href="/support"
                        className="inline-flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-sm font-black text-xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95"
                    >
                        <Mail className="w-6 h-6" />
                        CONTACT SUPPORT
                    </Link>
                </div>
            );
        }

        if (user.status === 'ALUMNI') {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-blue-200 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                    <div className="p-6 bg-blue-50 rounded-full mb-6">
                        <GraduationCap className="w-20 h-20 text-blue-500" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Alumni Access</h2>
                    <p className="text-gray-600 text-lg mb-8 font-medium">
                        You are viewing as an alumnus. Some features like active courses are not available.
                    </p>
                    {userStatusMessage && (
                        <div className="bg-blue-50 text-blue-800 p-6 rounded-sm border border-blue-100 w-full mb-8 text-left shadow-inner">
                            <p className="italic font-bold text-blue-900">{userStatusMessage}</p>
                        </div>
                    )}
                </div>
            );
        }

        // No restrictions – show full dashboard
        return null;
    };

    const statusOverlay = renderStatusMessage();
    if (statusOverlay) {
        return (
            <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
                <div className="mb-8">
                    <BackButton />
                    <div className="mt-8">
                        <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-xl mb-2">
                            Hello, {user.name}
                        </h1>
                        <p className="text-indigo-100 font-bold opacity-80 uppercase tracking-widest text-sm">
                            Student Portal • {orgName}
                        </p>
                    </div>
                </div>
                {statusOverlay}
            </div>
        );
    }

    // Full active dashboard
    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full animate-fade-in-up">
            <div className="mb-8">
                <BackButton />
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-xl mb-2">
                            Welcome back, {user.name?.split(' ')[0] || 'Student'}
                        </h1>
                        <p className="text-indigo-100 font-bold opacity-80 uppercase tracking-widest text-sm">
                            {orgName} • {user.status === 'ALUMNI' ? 'Alumni' : 'Active Student'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-sm border border-white/20">
                        <Calendar className="w-5 h-5 text-indigo-200" />
                        <span className="text-white font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Current Courses */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/50 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <BookOpen className="w-6 h-6 text-indigo-600" /> Current Courses
                            </h2>
                            <Link href={`/${params.orgSlug}/courses`} className="text-indigo-600 text-sm font-bold hover:underline">View All</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {courses.map(course => (
                                <div key={course.id} className="p-5 bg-white/50 border border-white/60 rounded-sm hover:shadow-xl transition group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-black text-gray-800">{course.name}</h3>
                                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-bold">{course.progress}%</span>
                                    </div>
                                    <p className="text-sm text-gray-600 flex items-center gap-1"><User className="w-3 h-3" /> {course.teacher}</p>
                                    <p className="text-sm text-gray-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {course.schedule}</p>
                                    <div className="mt-3 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-indigo-600 h-full" style={{ width: `${course.progress}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Deadlines & Recent Grades */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/50 p-6">
                            <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Upcoming</h3>
                            <ul className="space-y-4">
                                {assignments.filter(a => a.status === 'pending').map(item => (
                                    <li key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                                        <div>
                                            <p className="font-bold text-gray-800">{item.title}</p>
                                            <p className="text-xs text-gray-500">{item.course} • Due {new Date(item.dueDate).toLocaleDateString()}</p>
                                        </div>
                                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">Pending</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/50 p-6">
                            <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-emerald-500" /> Recent Grades</h3>
                            <ul className="space-y-4">
                                {recentGrades.map(grade => (
                                    <li key={grade.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                                        <div>
                                            <p className="font-bold text-gray-800">{grade.assignment}</p>
                                            <p className="text-xs text-gray-500">{grade.course} • {new Date(grade.date).toLocaleDateString()}</p>
                                        </div>
                                        <span className="text-sm font-black text-gray-900">{grade.score}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Announcements */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/50 p-6">
                        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-purple-500" /> Announcements</h3>
                        <div className="space-y-4">
                            {announcements.map(item => (
                                <div key={item.id} className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50/30">
                                    <p className="font-bold text-gray-800">{item.title}</p>
                                    <p className="text-sm text-gray-600 mt-1">{item.content}</p>
                                    <p className="text-xs text-gray-400 mt-2">{item.author} • {new Date(item.date).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar (1/3) */}
                <div className="space-y-8">
                    {/* Profile Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/50 p-6">
                        <h3 className="text-xl font-black text-gray-900 mb-6">Profile</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                                {user.avatarUrl ? (
                                    <img
                                        src={getPublicUrl(user.avatarUrl)}
                                        alt={user.name || 'User'}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    user.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <p className="font-black text-gray-800 text-lg">{user.name}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                <span className="inline-block mt-2 text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">ID: {user.id?.slice(0, 8)}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                            <div className="text-center p-3 bg-indigo-50 rounded-sm">
                                <p className="text-xs text-gray-500 font-bold">Attendance</p>
                                <p className="text-2xl font-black text-indigo-700">94%</p>
                            </div>
                            <div className="text-center p-3 bg-emerald-50 rounded-sm">
                                <p className="text-xs text-gray-500 font-bold">GPA</p>
                                <p className="text-2xl font-black text-emerald-700">3.8</p>
                            </div>
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/50 p-6">
                        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-600" /> Today's Schedule</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-600">10:00 AM</span>
                                <span className="text-gray-800 font-bold">Mathematics 101</span>
                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">Room 203</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-600">2:00 PM</span>
                                <span className="text-gray-800 font-bold">Physics 201</span>
                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">Lab 4</span>
                            </li>
                            <li className="text-center text-gray-400 text-sm py-2">No more classes today</li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-indigo-600 rounded-sm shadow-2xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-3">
                            <li><Link href={`/${params.orgSlug}/library`} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded transition"><BookOpen className="w-4 h-4" /> Library</Link></li>
                            <li><Link href={`/${params.orgSlug}/grades`} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded transition"><Trophy className="w-4 h-4" /> Full Gradebook</Link></li>
                            <li><Link href={`/${params.orgSlug}/attendance`} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded transition"><CheckCircle className="w-4 h-4" /> Attendance Record</Link></li>
                            <li><Link href={`/${params.orgSlug}/messages`} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded transition"><Mail className="w-4 h-4" /> Messages</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}