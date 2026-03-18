'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    GraduationCap, Clock, Calendar, Trophy, ShieldOff, XCircle, CheckCircle,
    LayoutDashboard,
    Book
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { DashboardLayout, SidebarLink } from '@/components/ui/DashboardLayout';
import { OrgStatus, Organization } from '@/types';
import Link from 'next/link';

// Dummy data types
export interface StudentCourse {
    id: string;
    name: string;
    teacher: string;
    schedule: string;
    progress: number;
    nextClass?: string;
}

export interface StudentAssignment {
    id: string;
    title: string;
    course: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded';
}

export interface StudentGrade {
    id: string;
    course: string;
    assignment: string;
    score: string;
    date: string;
}

export interface StudentAnnouncement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: string;
}

interface StudentPortalShellProps {
    children: React.ReactNode;
    activeTab: 'overview' | 'courses' | 'grades' | 'attendance';
}

export function StudentPortalShell({ children }: StudentPortalShellProps) {
    const { user, token, loading } = useAuth();
    const [orgName, setOrgName] = useState('Organization');
    const [orgStatus, setOrgStatus] = useState<string | null>(null);
    const [orgStatusMessage, setOrgStatusMessage] = useState<string | null>(null);
    const [userStatusMessage, setUserStatusMessage] = useState<string | null>(null);

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

        /* eslint-disable react-hooks/set-state-in-effect */
        if (user.status === 'SUSPENDED') {
            setUserStatusMessage('Your account has been temporarily suspended by the administration. Please contact the office for details.');
        } else if (user.status === 'ALUMNI') {
            setUserStatusMessage('You are marked as alumni. You can view your records but cannot access active courses.');
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [user, token]);

    const orgSlug = user?.orgSlug || '';
    const nameSlug = user?.name ? user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : 'dashboard';

    const studentLinks: SidebarLink[] = useMemo(() => [
        { id: 'overview', label: 'Overview', href: `/${orgSlug}/${nameSlug}`, icon: LayoutDashboard },
        { id: 'courses', label: 'My Courses', href: `/${orgSlug}/${nameSlug}/courses`, icon: Book },
        { id: 'grades', label: 'Grades', href: `/${orgSlug}/${nameSlug}/grades`, icon: Trophy },
        { id: 'attendance', label: 'Attendance', href: `/${orgSlug}/${nameSlug}/attendance`, icon: CheckCircle },
    ], [orgSlug, nameSlug]);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center h-screen bg-theme-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    const isOrgBlocked = orgStatus && orgStatus !== OrgStatus.APPROVED;

    const renderStatusOverlay = () => {
        if (isOrgBlocked) {
            switch (orgStatus) {
                case OrgStatus.PENDING:
                    return (
                        <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-2xl border border-white/40 text-center max-w-2xl mx-auto mt-10">
                            <Clock className="w-20 h-20 text-yellow-500 mb-6 animate-pulse" />
                            <h2 className="text-4xl font-black text-gray-900 mb-4">Organization Pending</h2>
                            <p className="text-gray-600 text-lg mb-8">Verification in progress. Features will unlock once approved.</p>
                        </div>
                    );
                case OrgStatus.REJECTED:
                    return (
                        <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-2xl border border-white/40 text-center max-w-2xl mx-auto mt-10">
                            <XCircle className="w-20 h-20 text-red-500 mb-6" />
                            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Access Unavailable</h2>
                            <p className="text-gray-600 text-lg mb-8">{orgStatusMessage || 'Institutional access restricted.'}</p>
                        </div>
                    );
                case OrgStatus.SUSPENDED:
                    return (
                        <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-2xl border border-orange-200 text-center max-w-2xl mx-auto mt-10">
                            <ShieldOff className="w-20 h-20 text-orange-500 mb-6" />
                            <h2 className="text-4xl font-black text-gray-900 mb-4">Institution Suspended</h2>
                            <p className="text-gray-600 text-lg">Access temporarily restricted for all accounts.</p>
                        </div>
                    );
            }
        }

        if (user.status === 'SUSPENDED') {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-2xl border border-orange-200 text-center max-w-2xl mx-auto mt-10">
                    <ShieldOff className="w-20 h-20 text-orange-500 mb-6" />
                    <h2 className="text-4xl font-black text-gray-900 mb-4">Account Suspended</h2>
                    <p className="text-gray-600 text-lg mb-8">{userStatusMessage}</p>
                    <Link href="/support" className="bg-gray-900 text-white px-8 py-4 rounded-sm font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Contact Support</Link>
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
                </div>
            );
        }

        return null;
    };

    const statusOverlay = renderStatusOverlay();

    return (
        <DashboardLayout links={studentLinks} title="Student Portal">
            <div className="flex flex-col w-full animate-fade-in-up">
                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-card-text tracking-tight drop-shadow-sm mb-2">
                            Welcome, {user.name?.split(' ')[0] || 'Student'}
                        </h1>
                        <p className="text-primary font-bold opacity-80 uppercase tracking-widest text-xs">
                            {orgName} • {user.status === 'ALUMNI' ? 'Alumni' : 'Active Student'}
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-3 bg-card px-6 py-3 rounded-sm border border-black/5 shadow-sm text-card-text/60">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                {statusOverlay ? (
                    statusOverlay
                ) : (
                    children
                )}
            </div>
        </DashboardLayout>
    );
}
