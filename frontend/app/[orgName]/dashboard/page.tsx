'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, LayoutTemplate, Users, BookOpen, Key, Settings, GraduationCap, AlertTriangle, XCircle, RefreshCw, Mail, LayoutDashboard, ShieldAlert, ShieldCheck, ShieldOff, Search, Filter, Check, X, Building, MapPin, Calendar } from 'lucide-react';


import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { BackButton } from '@/components/ui/BackButton';
import { api, Organization } from '@/src/lib/api';


export default function DashboardPage() {
    const { user: payload, loading, token } = useAuth();
    const router = useRouter();
    const [orgName, setOrgName] = useState('Organization');
    const [orgData, setOrgData] = useState<Organization | null>(null);



    useEffect(() => {
        if (!payload || !token) return;

        // Try to fetch actual org name for better display format than slug
        fetch('http://localhost:3000/org/settings', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setOrgData(data);
                if (data?.name) setOrgName(data.name);
                else if (payload.orgSlug) {

                    // Formatting fallback
                    const fallback = payload.orgSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                    setOrgName(fallback);
                }
            })
            .catch(() => {
                if (payload.orgSlug) {
                    const fallback = payload.orgSlug.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                    setOrgName(fallback);
                }
            });

    }, [payload, token]);

    useEffect(() => {
        // Any organization-specific initialization can go here
    }, []);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!payload) return null;

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8">
                <BackButton />
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">Dashboard</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        {payload.role !== 'TEACHER' && (
                            <Link
                                href={`/${payload.orgSlug}/dashboard/settings`}
                                className="text-sm font-semibold px-5 py-2.5 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg hover:bg-white/20 flex items-center space-x-2 transition-all text-white"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">Settings</span>
                            </Link>
                        )}
                        <Link
                            href={`/${payload.orgSlug}/change-password`}
                            className="text-sm font-semibold px-5 py-2.5 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg hover:bg-white/20 flex items-center space-x-2 transition-all text-white"
                        >
                            <Key className="w-4 h-4" />
                            <span className="hidden sm:inline">Password</span>
                        </Link>
                        <div className="text-sm font-medium px-5 py-2.5 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm shadow-inner flex items-center space-x-2 text-indigo-100">
                            <span>Logged in as:</span>
                            <span className="text-white font-bold truncate max-w-[200px]">{payload.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-8 animate-fade-in-up">
                {(orgData?.status || payload.status) === 'PENDING' && (

                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-white/40 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                        <div className="p-6 bg-yellow-50 rounded-full mb-6 relative">
                            <Clock className="w-20 h-20 text-yellow-500 animate-pulse" />
                            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Awaiting Approval</h2>
                        <p className="text-gray-600 text-lg mb-8 font-medium">
                            Your organization registration is currently being verified.
                            You'll have full dashboard access once EduManage confirms your details.
                        </p>
                        <div className="animate-pulse-orange text-white px-10 py-5 rounded-3xl font-black text-xl border border-yellow-300 w-full shadow-2xl flex items-center justify-center gap-3">
                            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                            Status: Pending Verification
                        </div>
                    </div>
                )}

                {(orgData?.status || payload.status) === 'REJECTED' && (

                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-white/40 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                        <div className="p-6 bg-yellow-50 rounded-full mb-6 relative">
                            <Clock className="w-20 h-20 text-yellow-500 animate-pulse" />
                            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Application Denied</h2>
                        <div className="bg-red-50 border border-red-100 p-6 rounded-3xl mb-8 text-left">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Rejection Reason</p>
                            <p className="text-red-700 font-medium italic">"{orgData?.statusMessage || 'No specific reason provided.'}"</p>
                        </div>
                        <p className="text-gray-600 text-lg mb-8 font-medium">
                            Please update your organization details and submit your application again for verification.
                        </p>
                        <Link
                            href={`/${payload.orgSlug}/dashboard/settings`}
                            className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-3xl font-black text-xl shadow-2xl shadow-red-600/30 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            <RefreshCw className="w-6 h-6" />
                            EDIT & RE-APPLY
                        </Link>
                    </div>
                )}

                {(orgData?.status || payload.status) === 'SUSPENDED' && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-orange-200 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                        <div className="p-6 bg-orange-50 rounded-full mb-6">
                            <AlertTriangle className="w-20 h-20 text-orange-500" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Account Suspended</h2>
                        <div className="bg-orange-50 text-orange-800 p-6 rounded-2xl border border-orange-100 w-full mb-8 text-left">
                            <h3 className="font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Reason for Suspension:</h3>
                            <p className="italic">{orgData?.statusMessage || 'Your organization account has been temporarily suspended. Please contact administration.'}</p>
                        </div>
                        <Link
                            href="/support"
                            className="inline-flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-3xl font-black text-xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95"
                        >

                            <Mail className="w-6 h-6" />
                            CONTACT SUPPORT
                        </Link>
                    </div>
                )}


                {(orgData?.status || payload.status) === 'APPROVED' && (


                    <div className="space-y-12">
                        {payload.role === 'STUDENT' ? (
                            <div className="p-10 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 border-l-[16px] border-l-emerald-500 flex items-center space-x-8 hover:translate-x-2 transition-transform">
                                <div className="p-6 bg-emerald-50 rounded-3xl shadow-inner">
                                    <GraduationCap className="w-12 h-12 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 leading-tight">Welcome, {payload.name || payload.email}</h2>
                                    <p className="text-gray-600 text-lg font-bold opacity-80 mt-1">Your student portal is currently being prepared.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-10 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 border-l-[16px] border-l-indigo-500 flex items-center space-x-8 hover:translate-x-2 transition-transform">
                                <div className="p-6 bg-indigo-50 rounded-3xl shadow-inner">
                                    <CheckCircle className="w-12 h-12 text-indigo-600" />
                                </div>
                                <div>
                                    {payload.role === 'TEACHER' ? (
                                        <>
                                            <h2 className="text-3xl font-black text-gray-900 leading-tight">Welcome, {payload.name || payload.email}</h2>
                                            <p className="text-gray-600 text-lg font-bold opacity-80 mt-1">{payload.designation || 'Teacher'} - {orgName}</p>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-4xl font-black text-gray-900 leading-tight">{orgName}</h2>
                                            <p className="text-gray-700 text-lg font-bold opacity-80 mt-1 uppercase tracking-widest flex items-center gap-2">
                                                <LayoutTemplate className="w-5 h-5" />
                                                Management Dashboard
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Dashboard Navigation Cards */}
                        {payload.role !== 'STUDENT' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {(payload.role === 'ORG_ADMIN' || payload.role === 'ORG_MANAGER') && (
                                    <Link href={`/${payload.orgSlug}/dashboard/teachers`} className="p-10 bg-white/70 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white/40 hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.3)] transition-all duration-500 group block relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="flex items-center space-x-5 mb-8 relative z-10">
                                            <div className="p-5 bg-indigo-100 text-indigo-600 rounded-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-lg group-hover:rotate-6">
                                                <Users className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">Teachers</h3>
                                        </div>
                                        <p className="text-gray-600 text-lg leading-relaxed font-bold opacity-80 relative z-10">Manage your faculty. Add, edit, or remove teaching staff with ease.</p>
                                        <div className="mt-8 flex items-center text-indigo-600 font-bold gap-2 group-hover:gap-4 transition-all opacity-0 group-hover:opacity-100">
                                            <span>Manage Faculty</span>
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                    </Link>
                                )}

                                <Link href={`/${payload.orgSlug}/dashboard/classes`} className="p-10 bg-white/70 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white/40 hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(168,85,247,0.3)] transition-all duration-500 group block relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="flex items-center space-x-5 mb-8 relative z-10">
                                        <div className="p-5 bg-purple-100 text-purple-600 rounded-3xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-lg group-hover:rotate-6">
                                            <BookOpen className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-purple-600 transition-colors">Classes</h3>
                                    </div>
                                    <p className="text-gray-600 text-lg leading-relaxed font-bold opacity-80 relative z-10">Organize your curriculum. Create and manage academic courses efficiently.</p>
                                    <div className="mt-8 flex items-center text-purple-600 font-bold gap-2 group-hover:gap-4 transition-all opacity-0 group-hover:opacity-100">
                                        <span>View Classes</span>
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                </Link>

                                <Link href={`/${payload.orgSlug}/dashboard/students`} className="p-10 bg-white/70 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white/40 hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(16,185,129,0.3)] transition-all duration-500 group block relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="flex items-center space-x-5 mb-8 relative z-10">
                                        <div className="p-5 bg-emerald-100 text-emerald-600 rounded-3xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-lg group-hover:rotate-6">
                                            <GraduationCap className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-emerald-600 transition-colors">Students</h3>
                                    </div>
                                    <p className="text-gray-600 text-lg leading-relaxed font-bold opacity-80 relative z-10">Track student progress. Manage profiles and academic associations seamlessly.</p>
                                    <div className="mt-8 flex items-center text-emerald-600 font-bold gap-2 group-hover:gap-4 transition-all opacity-0 group-hover:opacity-100">
                                        <span>Student Portal</span>
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
