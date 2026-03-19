'use client';

import { useEffect, useState } from 'react';
import {
    Users, BookOpen, Calendar, CheckCircle, FileText, PlusCircle, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Organization, Role } from '@/types';

export default function TeacherOverviewPage() {
    const { user: payload, loading, token } = useAuth();
    const [orgName, setOrgName] = useState('Organization');
    const [fetchingData, setFetchingData] = useState(true);

    useEffect(() => {
        if (!payload || !token) return;

        api.org.getOrgData(token)
            .then((settings) => {
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
        <div className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Classes */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-tight text-slate-900 leading-none">
                        <BookOpen className="w-5 h-5 text-primary" /> My Classes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2].map(i => (
                            <div key={i} className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md transition-shadow group border-l-4 border-l-primary text-left">
                                <h4 className="font-black text-slate-900 group-hover:text-primary transition-colors text-lg italic uppercase tracking-tighter">Physics 201</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Section B • 24 students</p>
                                <div className="mt-6 flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
                                        <Calendar className="w-4 h-4 text-primary" /> Tue, Thu 2pm
                                    </span>
                                    <Link href="#" className="px-4 py-2 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-primary hover:text-white transition-all">View Details</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-tight text-slate-900 leading-none">
                        <PlusCircle className="w-5 h-5 text-primary" /> Quick Actions
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-3">
                        {payload.role === Role.ORG_MANAGER && (
                            <Link href={`/${payload.orgSlug}/admin`} className="flex items-center gap-3 p-3 bg-primary/10 hover:bg-primary/20 rounded-sm transition font-black text-[11px] text-primary uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4" /> Admin Controls
                            </Link>
                        )}
                        <Link href={`/${payload.orgSlug}/attendance`} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-sm transition font-black text-[11px] text-slate-900 uppercase tracking-widest">
                            <CheckCircle className="w-4 h-4 text-primary" /> Take Attendance
                        </Link>
                        <Link href={`/${payload.orgSlug}/grades`} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-sm transition font-black text-[11px] text-slate-900 uppercase tracking-widest">
                            <FileText className="w-4 h-4 text-primary" /> Manage Grades
                        </Link>
                        <Link href={`/${payload.orgSlug}/sections`} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-sm transition font-black text-[11px] text-slate-900 uppercase tracking-widest">
                            <BookOpen className="w-4 h-4 text-primary" /> Manage Assessments
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
