'use client';

import { useEffect, useState } from 'react';
import {
    Clock, Users, GraduationCap, ShieldOff, RefreshCw, Mail, Settings,
    Building, BookOpen, MapPin, Phone, Calendar, CheckCircle, FileText, PlusCircle, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Organization, OrgStats, Role, OrgStatus } from '@/types';
import { OrgLogoOrIcon } from '@/lib/utils';

export default function DashboardPage() {
    const { user: payload, loading, token } = useAuth();
    const [orgName, setOrgName] = useState('Organization');
    const [orgData, setOrgData] = useState<Organization | null>(null);
    const [stats, setStats] = useState<OrgStats | null>(null);
    const [fetchingData, setFetchingData] = useState(true);

    useEffect(() => {
        if (!payload || !token) return;

        setFetchingData(true);
        Promise.all([
            api.org.getOrgData(token),
            api.org.getStats(token)
        ])
            .then(([settings, statsData]) => {
                setOrgData(settings);
                setStats(statsData);
                if (settings?.name) setOrgName(settings.name);
                else if (payload.orgSlug) {
                    const fallback = payload.orgSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                    setOrgName(fallback);
                }
            })
            .catch((err) => {
                console.error("Failed to fetch dashboard data", err);
                if (payload.orgSlug) {
                    const fallback = payload.orgSlug.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                    setOrgName(fallback);
                }
            })
            .finally(() => setFetchingData(false));
    }, [payload, token]);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!payload) return null;

    if (fetchingData) {
        return (
            <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-pulse">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="h-12 w-64 bg-white/30 rounded-sm" />
                    <div className="h-10 w-56 bg-white/20 rounded-sm" />
                </div>
                <div className="h-52 bg-white/20 rounded-sm" />
            </div>
        );
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <h1 className="text-6xl font-black text-gray-800 tracking-tighter drop-shadow-2xl">{orgName}</h1>
                </div>
            </div>

            <div className="space-y-8">
                {/* Status‑specific messages (unchanged) */}
                {orgData?.status === OrgStatus.PENDING && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-white/40 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                        <div className="p-6 bg-yellow-50 rounded-full mb-6 relative">
                            <Clock className="w-20 h-20 text-yellow-500 animate-pulse" />
                            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Awaiting Approval</h2>
                        <p className="text-gray-600 text-lg mb-8 font-medium">
                            Your organization registration is currently being verified.
                            You'll have full dashboard access once EduManage confirms your details.
                        </p>
                        <div className="animate-pulse-orange text-white px-10 py-5 rounded-sm font-black text-xl border border-yellow-300 w-full shadow-2xl flex items-center justify-center gap-3">
                            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                            Status: Pending Verification
                        </div>
                    </div>
                )}

                {orgData?.status === OrgStatus.REJECTED && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-white/40 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                        <div className="p-6 bg-yellow-50 rounded-full mb-6 relative">
                            <Clock className="w-20 h-20 text-yellow-500 animate-pulse" />
                            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Application Denied</h2>
                        <div className="bg-red-50 border border-red-100 p-6 rounded-sm mb-8 text-left">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Rejection Reason</p>
                            <p className="text-red-700 font-medium italic">"{orgData?.statusMessage || 'No specific reason provided.'}"</p>
                        </div>
                        <p className="text-gray-600 text-lg mb-8 font-medium">
                            Please update your organization details and submit your application again for verification.
                        </p>
                        <Link
                            href={`/${payload.orgSlug}/settings`}
                            className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-sm font-black text-xl shadow-2xl shadow-red-600/30 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            <RefreshCw className="w-6 h-6" />
                            EDIT & RE-APPLY
                        </Link>
                    </div>
                )}

                {orgData?.status === OrgStatus.SUSPENDED && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-orange-200 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                        <div className="p-6 bg-orange-50 rounded-full mb-6 relative">
                            <ShieldOff className="w-20 h-20 text-orange-500" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Access Restricted</h2>
                        <p className="text-gray-600 text-lg mb-8 font-medium">
                            {payload.role === 'TEACHER' || payload.role === 'ORG_MANAGER'
                                ? "Service for your organization is temporarily paused. Your records and data are safe, but management actions are currently restricted."
                                : "Your organization account has been temporarily suspended due to administrative reasons."}
                        </p>
                        <div className="bg-orange-50 text-orange-800 p-6 rounded-sm border border-orange-100 w-full mb-8 text-left shadow-inner">
                            <h3 className="font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider text-orange-900/60"><ShieldOff className="w-4 h-4" /> Administrative Notice</h3>
                            <p className="italic font-bold text-orange-900">{orgData?.statusMessage || 'Please contact your institution\'s administration or EduManage support for more details.'}</p>
                        </div>
                        <Link
                            href="/support"
                            className="inline-flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-sm font-black text-xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95"
                        >
                            <Mail className="w-6 h-6" />
                            CONTACT SUPPORT
                        </Link>
                    </div>
                )}

                {/* Organization Profile Card – shown for all approved & non‑pending statuses */}
                {orgData && orgData.status !== OrgStatus.PENDING && (
                    <div className="p-6 bg-card text-card-text backdrop-blur-xl rounded-sm shadow-xl border border-white/40 flex flex-col md:flex-row gap-6 items-start">
                        <OrgLogoOrIcon
                            logoUrl={orgData.logoUrl}
                            orgName={orgData.name}
                            className="w-24 h-24 relative rounded-full overflow-hidden border-2 border-white/50 shadow-lg"
                        />
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-xs font-black opacity-40 uppercase tracking-widest mb-1">Organization</h3>
                                <p className="text-xl font-black">{orgData.name}</p>
                                <p className="text-sm opacity-70 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {orgData.location}</p>
                                <p className="text-sm opacity-70 flex items-center gap-1"><Building className="w-3 h-3" /> {orgData.type}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-black opacity-40 uppercase tracking-widest mb-1">Contact</h3>
                                {orgData.contactEmail && (
                                    <p className="text-sm flex items-center gap-1"><Mail className="w-3 h-3" /> {orgData.contactEmail}</p>
                                )}
                                {orgData.phone && (
                                    <p className="text-sm flex items-center gap-1"><Phone className="w-3 h-3" /> {orgData.phone}</p>
                                )}
                                <p className="text-xs opacity-50 mt-2">Member since {new Date(orgData.createdAt).toDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Role‑specific dashboard content */}
                {orgData?.status === OrgStatus.APPROVED && (
                    <div className="space-y-12">
                        {payload.role === Role.STUDENT ? (
                            // STUDENT VIEW
                            <div className="space-y-8">
                                <div className="p-8 bg-card text-card-text backdrop-blur-xl rounded-sm shadow-xl border border-white/40 border-l-8 border-l-secondary flex items-center space-x-6">
                                    <div className="p-4 bg-secondary/10 rounded-sm shadow-inner">
                                        <GraduationCap className="w-10 h-10 text-secondary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black leading-tight">Welcome, {payload.name || payload.email}</h2>
                                        <p className="opacity-80 mt-0.5 text-sm font-bold">Your learning dashboard</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Enrolled Courses */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <h3 className="text-lg font-black flex items-center gap-2"><BookOpen className="w-5 h-5" /> Your Courses</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Placeholder cards – replace with real data */}
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="p-4 bg-white/30 backdrop-blur-sm border border-white/40 rounded-sm shadow-md hover:shadow-xl transition">
                                                    <h4 className="font-bold">Mathematics 101</h4>
                                                    <p className="text-xs opacity-70">Section A • Teacher: J. Smith</p>
                                                    <div className="mt-3 flex items-center justify-between text-sm">
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Mon, Wed 10am</span>
                                                        <span className="bg-secondary/20 text-secondary-text px-2 py-0.5 rounded-full text-xs font-bold">75%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Upcoming Assignments */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black flex items-center gap-2"><FileText className="w-5 h-5" /> Upcoming</h3>
                                        <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-sm p-4 shadow-md space-y-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex items-center justify-between border-b border-white/20 pb-2 last:border-0">
                                                    <div>
                                                        <p className="font-bold text-sm">Algebra Quiz</p>
                                                        <p className="text-xs opacity-60">Due: Tomorrow</p>
                                                    </div>
                                                    <span className="text-xs bg-yellow-500/20 text-yellow-800 px-2 py-0.5 rounded-full">Pending</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : payload.role === Role.TEACHER ? (
                            // TEACHER VIEW
                            <div className="space-y-8">
                                <div className="p-8 bg-card text-card-text backdrop-blur-xl rounded-sm shadow-xl border border-white/40 border-l-8 border-l-primary flex items-center space-x-6">
                                    <div className="p-4 bg-primary/10 rounded-sm shadow-inner">
                                        <Users className="w-10 h-10 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black leading-tight">Welcome, {payload.name || payload.email}</h2>
                                        <p className="opacity-80 mt-0.5 text-sm font-bold">{payload.designation || 'Teacher'} at {orgName}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* My Classes */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <h3 className="text-lg font-black flex items-center gap-2"><BookOpen className="w-5 h-5" /> My Classes</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[1, 2].map(i => (
                                                <div key={i} className="p-4 bg-white/30 backdrop-blur-sm border border-white/40 rounded-sm shadow-md hover:shadow-xl transition">
                                                    <h4 className="font-bold">Physics 201</h4>
                                                    <p className="text-xs opacity-70">Section B • 24 students</p>
                                                    <div className="mt-3 flex items-center justify-between text-sm">
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Tue, Thu 2pm</span>
                                                        <Link href="#" className="text-primary text-xs font-bold hover:underline">View</Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black flex items-center gap-2"><PlusCircle className="w-5 h-5" /> Quick Actions</h3>
                                        <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-sm p-4 shadow-md space-y-2">
                                            <Link href={`/${payload.orgSlug}/attendance`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition">
                                                <CheckCircle className="w-4 h-4 text-primary" /> Take Attendance
                                            </Link>
                                            <Link href={`/${payload.orgSlug}/grades`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition">
                                                <FileText className="w-4 h-4 text-primary" /> Enter Grades
                                            </Link>
                                            <Link href={`/${payload.orgSlug}/assignments`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition">
                                                <BookOpen className="w-4 h-4 text-primary" /> New Assignment
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // ADMIN / ORG_MANAGER VIEW
                            <div className="space-y-12">
                                {/* Key metrics with more meaning */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="p-6 bg-card text-card-text backdrop-blur-sm rounded-sm border border-white/30 shadow-sm flex flex-col gap-1 transition-all hover:scale-[1.02]">
                                        <span className="text-xs font-black opacity-40 uppercase tracking-widest">Total Users</span>
                                        <span className="text-3xl font-black">{(stats?.TEACHERS ?? 0) + (stats?.STUDENTS ?? 0)}</span>
                                        <span className="text-xs opacity-60">{stats?.TEACHERS} teachers · {stats?.STUDENTS} students</span>
                                    </div>
                                    <div className="p-6 bg-card text-card-text backdrop-blur-sm rounded-sm border border-white/30 shadow-sm flex flex-col gap-1 transition-all hover:scale-[1.02]">
                                        <span className="text-xs font-black opacity-40 uppercase tracking-widest">Courses</span>
                                        <span className="text-3xl font-black">{stats?.COURSES ?? 0}</span>
                                        <span className="text-xs opacity-60">{stats?.SECTIONS ?? 0} sections</span>
                                    </div>
                                    <div className="p-6 bg-card text-card-text backdrop-blur-sm rounded-sm border border-white/30 shadow-sm flex flex-col gap-1 transition-all hover:scale-[1.02]">
                                        <span className="text-xs font-black opacity-40 uppercase tracking-widest">Pending Requests</span>
                                        <span className="text-3xl font-black text-yellow-600">3</span> {/* Placeholder */}
                                        <span className="text-xs opacity-60">2 teachers · 1 student</span>
                                    </div>
                                    <div className="p-6 bg-card text-card-text backdrop-blur-sm rounded-sm border border-white/30 shadow-sm flex flex-col gap-1 transition-all hover:scale-[1.02]">
                                        <span className="text-xs font-black opacity-40 uppercase tracking-widest">System Health</span>
                                        <div className="flex items-center gap-2 text-green-600 font-bold">
                                            <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                                            <span>All systems go</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Two‑column layout for recent activity & quick actions */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Recent Activity */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <h3 className="text-lg font-black text-card-text flex items-center gap-2"><Clock className="w-5 h-5" /> Recent Activity</h3>
                                        <div className="bg-white/40 backdrop-blur-sm border border-white/40 rounded-sm p-4 shadow-md space-y-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex items-start gap-3 border-b border-black/5 pb-2 last:border-0">
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                        <UserPlus className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-800">New teacher registered</p>
                                                        <p className="text-xs text-gray-500 font-medium">Dr. Sarah Johnson · 2 hours ago</p>
                                                    </div>
                                                    <span className="text-xs bg-yellow-500/20 text-yellow-800 px-2 py-0.5 rounded-full font-bold">Pending</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black text-card-text flex items-center gap-2"><PlusCircle className="w-5 h-5" /> Quick Actions</h3>
                                        <div className="bg-white/40 backdrop-blur-sm border border-white/40 rounded-sm p-4 shadow-md space-y-2">
                                            <Link href={`/${payload.orgSlug}/dashboard/teachers/add`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition text-gray-700 hover:text-gray-900 font-bold">
                                                <UserPlus className="w-4 h-4 text-primary" /> Add Teacher
                                            </Link>
                                            <Link href={`/${payload.orgSlug}/dashboard/students/add`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition text-gray-700 hover:text-gray-900 font-bold">
                                                <UserPlus className="w-4 h-4 text-primary" /> Add Student
                                            </Link>
                                            <Link href={`/${payload.orgSlug}/dashboard/courses/create`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition text-gray-700 hover:text-gray-900 font-bold">
                                                <PlusCircle className="w-4 h-4 text-primary" /> Create Course
                                            </Link>
                                            <Link href={`/${payload.orgSlug}/settings`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition text-gray-700 hover:text-gray-900 font-bold">
                                                <Settings className="w-4 h-4 text-primary" /> Org Settings
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}