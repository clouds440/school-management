'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, GraduationCap, ShieldOff, RefreshCw, Mail, LayoutDashboard, Building } from 'lucide-react';

import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { api, Organization } from '@/src/lib/api';


export default function DashboardPage() {
    const { user: payload, loading, token } = useAuth();
    const router = useRouter();
    const [orgName, setOrgName] = useState('Organization');
    const [orgData, setOrgData] = useState<Organization | null>(null);
    const [fetchingData, setFetchingData] = useState(true);


    useEffect(() => {
        if (!payload || !token) return;

        setFetchingData(true);
        // Try to fetch actual org name for better display format than slug
        api.org.getSettings(token)
            .then(data => {
                setOrgData(data);
                if (data?.name) setOrgName(data.name);
                else if (payload.orgSlug) {
                    const fallback = payload.orgSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                    setOrgName(fallback);
                }
            })
            .catch(() => {
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

    // Loading skeleton shown while org data is being fetched
    // (prevents flash of JWT status before real status arrives)
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
                    <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">Dashboard</h1>
                </div>
            </div>

            <div className="space-y-8">
                {orgData?.status === 'PENDING' && (
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

                {orgData?.status === 'REJECTED' && (
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

                {orgData?.status === 'SUSPENDED' && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-orange-200 text-center max-w-2xmx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
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
                            <h3 className="font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider text-orange-900/60 "><ShieldOff className="w-4 h-4" /> Administrative Notice</h3>
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

                {orgData?.status === 'APPROVED' && (
                    <div className="space-y-12">
                        {payload.role === 'STUDENT' ? (
                            <div className="p-8 bg-card text-card-text backdrop-blur-xl rounded-sm shadow-xl border border-white/40 border-l-8 border-l-secondary flex items-center space-x-6">
                                <div className="p-4 bg-secondary/10 rounded-sm shadow-inner">
                                    <GraduationCap className="w-10 h-10 text-secondary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black leading-tight">Welcome, {payload.name || payload.email}</h2>
                                    <p className="opacity-80 mt-0.5 text-sm font-bold">Your student portal is currently being prepared.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-8 bg-card text-card-text backdrop-blur-xl rounded-sm shadow-xl border border-white/40 border-l-8 border-l-primary flex items-center space-x-6">
                                    <div className="p-4 bg-primary/10 rounded-sm shadow-inner">
                                        {payload.role === 'TEACHER' ? <Users className="w-10 h-10 text-primary" /> : <Building className="w-10 h-10 text-primary" />}
                                    </div>
                                    <div>
                                        {payload.role === 'TEACHER' ? (
                                            <>
                                                <h2 className="text-2xl font-black leading-tight">Welcome, {payload.name || payload.email}</h2>
                                                <p className="opacity-80 mt-0.5 text-sm font-bold">{payload.designation || 'Teacher'} - {orgName}</p>
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="text-3xl font-black leading-tight">{orgName}</h2>
                                                <p className="opacity-80 mt-0.5 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    Management Dashboard
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Summary Section - Branded Mix */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="p-6 bg-card text-card-text backdrop-blur-sm rounded-sm border border-white/30 shadow-sm flex flex-col gap-1">
                                        <span className="text-xs font-black opacity-40 uppercase tracking-widest">System Status</span>
                                        <div className="flex items-center gap-2 text-primary font-bold">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                            <span>Fully Operational</span>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-secondary text-secondary-text rounded-sm shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col gap-1">
                                        <span className="text-xs font-black opacity-60 uppercase tracking-widest">Active Role</span>
                                        <span className="text-xl font-black">{payload?.role?.replace('_', ' ')}</span>
                                    </div>

                                    <div className="p-6 bg-card text-card-text backdrop-blur-sm rounded-sm border border-white/30 shadow-sm flex flex-col gap-1">
                                        <span className="text-xs font-black opacity-40 uppercase tracking-widest">Institution</span>
                                        <span className="font-bold truncate">{orgName}</span>
                                    </div>

                                    <div className="p-6 bg-primary text-primary-text rounded-sm shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col gap-1 text-center justify-center">
                                        <p className="text-[10px] font-bold opacity-80">Use symbols in the sidebar to navigate various sections.</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
