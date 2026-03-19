'use client';

import { useEffect, useState } from 'react';
import {
    Clock, Users, GraduationCap, ShieldOff, Mail,
    Building, BookOpen, MapPin, Phone, PlusCircle, UserPlus, Settings
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Organization, OrgStats, Role, OrgStatus } from '@/types';
import { OrgLogoOrIcon } from '@/components/ui/OrgLogoOrIcon';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export default function AdminPage() {
    const { user: payload, loading, token } = useAuth();
    const [orgData, setOrgData] = useState<Organization | null>(null);
    const [stats, setStats] = useState<OrgStats | null>(null);
    const [fetchingData, setFetchingData] = useState(true);

    useEffect(() => {
        if (!payload || !token) return;

        Promise.all([
            api.org.getOrgData(token),
            api.org.getStats(token)
        ])
            .then(([settings, statsData]) => {
                setOrgData(settings);
                setStats(statsData);
            })
            .catch((err) => {
                console.error("Failed to fetch admin dashboard data", err);
            })
            .finally(() => setFetchingData(false));
    }, [payload, token]);

    if (loading || fetchingData) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!payload || !orgData) return null;

    if (payload.role !== Role.ORG_ADMIN && payload.role !== Role.ORG_MANAGER) {
        return <div>Access Denied</div>;
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="space-y-8">

                {/* Organization Profile Card */}
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
                            <p className="text-sm opacity-70 flex items-center gap-1"><MapPin className="w-3 h-3" /> {orgData.location}</p>
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

                {/* Key metrics */}
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
                            <Link href={`/${payload.orgSlug}/teachers/add`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition text-gray-700 hover:text-gray-900 font-bold">
                                <UserPlus className="w-4 h-4 text-primary" /> Add Teacher
                            </Link>
                            <Link href={`/${payload.orgSlug}/students/add`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition text-gray-700 hover:text-gray-900 font-bold">
                                <UserPlus className="w-4 h-4 text-primary" /> Add Student
                            </Link>
                            <Link href={`/${payload.orgSlug}/courses/create`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition text-gray-700 hover:text-gray-900 font-bold">
                                <PlusCircle className="w-4 h-4 text-primary" /> Create Course
                            </Link>
                            <Link href={`/${payload.orgSlug}/settings`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition text-gray-700 hover:text-gray-900 font-bold">
                                <Settings className="w-4 h-4 text-primary" /> Org Settings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
