'use client';

import { useEffect, useState } from 'react';
import {
    Users, BookOpen, Calendar, CheckCircle, FileText, PlusCircle, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Organization, Role, OrgStatus } from '@/types';

export default function TeacherLandingPage() {
    const { user: payload, loading, token } = useAuth();
    const [orgName, setOrgName] = useState('Organization');
    const [orgData, setOrgData] = useState<Organization | null>(null);
    const [fetchingData, setFetchingData] = useState(true);

    useEffect(() => {
        if (!payload || !token) return;

        api.org.getOrgData(token)
            .then((settings) => {
                setOrgData(settings);
                if (settings?.name) setOrgName(settings.name);
            })
            .catch((err) => {
                console.error("Failed to fetch teacher dashboard data", err);
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

    if (!payload) return null;

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="space-y-8">
                <div className="p-8 bg-card text-card-text backdrop-blur-xl rounded-sm shadow-xl border border-white/40 border-l-8 border-l-primary flex items-center space-x-6">
                    <div className="p-4 bg-primary/10 rounded-sm shadow-inner">
                        <Users className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black leading-tight">Welcome, {payload.name || payload.email}</h2>
                        <p className="opacity-80 mt-0.5 text-sm font-bold">{payload.designation || (payload.role === Role.ORG_MANAGER ? 'Manager' : 'Teacher')} at {orgName}</p>
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
                            {payload.role === Role.ORG_MANAGER && (
                                <Link href={`/${payload.orgSlug}/admin`} className="flex items-center gap-3 p-2 bg-primary/10 hover:bg-primary/20 rounded transition font-bold text-primary">
                                    <ShieldCheck className="w-4 h-4" /> Admin Controls
                                </Link>
                            )}
                            <Link href={`/${payload.orgSlug}/attendance`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition font-medium">
                                <CheckCircle className="w-4 h-4 text-primary" /> Take Attendance
                            </Link>
                            <Link href={`/${payload.orgSlug}/grades`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition font-bold">
                                <FileText className="w-4 h-4 text-primary" /> Manage Grades
                            </Link>
                            <Link href={`/${payload.orgSlug}/sections`} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded transition font-bold">
                                <BookOpen className="w-4 h-4 text-primary" /> Manage Assessments
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
