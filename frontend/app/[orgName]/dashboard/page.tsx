'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, LayoutTemplate, Users, BookOpen, Key, Settings, GraduationCap } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { BackButton } from '@/components/ui/BackButton';

export default function DashboardPage() {
    const { user: payload, loading, token } = useAuth();
    const router = useRouter();
    const [orgName, setOrgName] = useState('Organization');

    useEffect(() => {
        if (!payload || !token) return;

        // Try to fetch actual org name for better display format than slug
        fetch('http://localhost:3000/org/settings', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data?.name) setOrgName(data.name);
                else if (payload.orgSlug) {
                    // Formatting fallback
                    const fallback = payload.orgSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                    setOrgName(fallback);
                }
            })
            .catch(() => {
                if (payload.orgSlug) setOrgName(payload.orgSlug);
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

            <div className="flex-1 space-y-8">
                {!payload.approved ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 text-center max-w-2xl mx-auto mt-10">
                        <Clock className="w-20 h-20 text-yellow-500 mb-6 animate-pulse" />
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Awaiting Approval</h2>
                        <p className="text-gray-600 text-lg mb-8">
                            Your organization registration is currently being verified.
                            You'll have full dashboard access once a super admin confirms your details.
                        </p>
                        <div className="bg-yellow-50 text-yellow-800 px-8 py-4 rounded-2xl font-bold border border-yellow-100 w-full shadow-sm">
                            Status: Pending Verification
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {payload.role === 'STUDENT' ? (
                            <div className="p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 border-l-[12px] border-l-emerald-500 flex items-center space-x-6">
                                <div className="p-4 bg-emerald-50 rounded-2xl">
                                    <GraduationCap className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">Welcome, {payload.name || payload.email}</h2>
                                    <p className="text-gray-600 font-medium">Your student portal is currently being prepared.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 border-l-[12px] border-l-indigo-500 flex items-center space-x-6">
                                <div className="p-4 bg-indigo-50 rounded-2xl">
                                    <CheckCircle className="w-10 h-10 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">{orgName}</h2>
                                    <p className="text-gray-600 font-medium">Organization Management Dashboard Overview</p>
                                </div>
                            </div>
                        )}

                        {/* Dashboard Navigation Cards */}
                        {payload.role !== 'STUDENT' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {payload.role === 'ORG_ADMIN' && (
                                    <Link href={`/${payload.orgSlug}/dashboard/teachers`} className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 hover:-translate-y-2 hover:shadow-2xl transition-all group block relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                                        <div className="flex items-center space-x-4 mb-6 relative z-10">
                                            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                <Users className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Teachers</h3>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed font-medium relative z-10">Add, edit, or remove teaching staff from your organization.</p>
                                    </Link>
                                )}

                                <Link href={`/${payload.orgSlug}/dashboard/classes`} className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 hover:-translate-y-2 hover:shadow-2xl transition-all group block relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="flex items-center space-x-4 mb-6 relative z-10">
                                        <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                                            <BookOpen className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">Classes</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed font-medium relative z-10">Create and organize courses and academic classes.</p>
                                </Link>

                                <Link href={`/${payload.orgSlug}/dashboard/students`} className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 hover:-translate-y-2 hover:shadow-2xl transition-all group block relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="flex items-center space-x-4 mb-6 relative z-10">
                                        <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                            <GraduationCap className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">Students</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed font-medium relative z-10">Manage student profiles, enrollments, and academic associations.</p>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
