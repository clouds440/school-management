'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout, SidebarLink } from '@/components/ui/DashboardLayout';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap,
    MessageSquare, Settings, LibraryBig, Trophy,
    Clock, ShieldOff, RefreshCw, Mail, CheckCircle, Book,
    Layers
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { Organization, Role, OrgStatus, Teacher, Student } from '@/types';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { useAuth, JwtPayload } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { useSocket } from '@/hooks/useSocket';

// Status Message Components
const StatusOverlay = ({ orgData, user, orgSlug }: { orgData: Organization, user: JwtPayload | null, orgSlug: string }) => {
    if (!orgData) return null;

    if (orgData.status === OrgStatus.PENDING) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-xl border border-white/40 text-center max-w-2xl mx-auto my-10">
                <div className="p-6 bg-yellow-50 rounded-full mb-6 relative">
                    <Clock className="w-20 h-20 text-yellow-500 animate-pulse" />
                    <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Awaiting Approval</h2>
                <p className="text-gray-600 text-lg mb-8 font-medium">
                    Your organization registration is currently being verified.
                    You&apos;ll have full access once EduManage confirms your details.
                </p>
                <div className="bg-yellow-500 text-white px-10 py-5 rounded-sm font-black text-xl border border-yellow-300 w-full shadow-2xl flex items-center justify-center gap-3">
                    Status: Pending Verification
                </div>
            </div>
        );
    }

    if (orgData.status === OrgStatus.REJECTED) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-xl border border-white/40 text-center max-w-2xl mx-auto my-10">
                <div className="p-6 bg-red-50 rounded-full mb-6">
                    <ShieldOff className="w-20 h-20 text-red-500" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Application Denied</h2>
                <div className="bg-red-50 border border-red-100 p-6 rounded-sm mb-8 text-left w-full">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Rejection Reason</p>
                    <MarkdownRenderer
                        content={orgData.statusHistory && orgData.statusHistory.length > 0
                            ? orgData.statusHistory[orgData.statusHistory.length - 1].message
                            : 'No reason provided.'}
                        className="text-red-700 text-lg font-medium prose prose-red prose-sm max-w-none"
                    />
                </div>
                <p className="text-gray-600 text-lg mb-8 font-medium">
                    Please update your organization details and submit your application again.
                </p>
                {user?.role === Role.ORG_ADMIN && (
                    <Link
                        href={`/${orgSlug}/settings`}
                        className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-sm font-black text-xl shadow-2xl transition-all hover:-translate-y-1"
                    >
                        <RefreshCw className="w-6 h-6" />
                        EDIT &amp; RE-APPLY
                    </Link>
                )}
            </div>
        );
    }

    if (orgData.status === OrgStatus.SUSPENDED) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-xl border border-orange-200 text-center max-w-2xl mx-auto my-10">
                <div className="p-6 bg-orange-50 rounded-full mb-6">
                    <ShieldOff className="w-20 h-20 text-orange-500" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Access Restricted</h2>
                <p className="text-gray-600 text-lg mb-8 font-medium">
                    Your organization account has been temporarily suspended.
                </p>
                <div className="bg-orange-50 text-orange-800 p-6 rounded-sm border border-orange-100 w-full mb-8 text-left">
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider text-orange-900/60"><ShieldOff className="w-4 h-4" /> Suspension Reason</h3>
                    <MarkdownRenderer
                        content={orgData.statusHistory && orgData.statusHistory.length > 0
                            ? orgData.statusHistory[orgData.statusHistory.length - 1].message
                            : 'Please contact support for more details.'}
                        className="italic font-bold text-orange-900 prose prose-orange prose-sm max-w-none"
                    />
                </div>
                <Link
                    href={`/${orgSlug}/mail`}
                    className="inline-flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-sm font-black text-xl shadow-2xl transition-all hover:-translate-y-1"
                >
                    <Mail className="w-6 h-6" />
                    CONTACT MAIL
                </Link>
            </div>
        );
    }

    return null;
};

export default function OrgLayout({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const { state, dispatch } = useGlobal();
    const pathname = usePathname();

    const stats = state.stats.org;
    const orgData = state.stats.orgData;
    const isApproved = orgData?.status === OrgStatus.APPROVED;
    const orgSlug = pathname.split('/')[1] || user?.orgSlug || 'organization';

    const { subscribe } = useSocket({
        token: token,
        userId: user?.id,
        userRole: user?.role
    });

    useEffect(() => {
        const fetchAllData = () => {
            if (token && (user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER || user?.role === Role.TEACHER || user?.role === Role.STUDENT)) {
                // Fetch Org Stats
                api.org.getStats(token)
                    .then(data => dispatch({ type: 'STATS_SET_ORG', payload: data }))
                    .catch(err => console.error('Failed to fetch org stats:', err));

                // Fetch Org Data
                api.org.getOrgData(token)
                    .then((data: Organization) => {
                        dispatch({ type: 'STATS_SET_ORG_DATA', payload: data });
                    })
                    .catch((err) => console.error('Failed to fetch org data:', err));

                // Fetch Mail Stats
                api.requests.getUnreadCount(token)
                    .then(data => dispatch({ type: 'STATS_SET_MAIL', payload: data }))
                    .catch(err => console.error('Failed to fetch mail stats:', err));

                // Fetch User Profile (if Teacher or Student)
                if ((user?.role === Role.TEACHER || user?.role === Role.STUDENT || user?.role === Role.ORG_MANAGER) && !state.auth.userProfile) {
                    api.org.getProfile(token)
                        .then(data => dispatch({ type: 'AUTH_SET_PROFILE', payload: data as Teacher | Student }))
                        .catch(err => console.error('Failed to fetch profile:', err));
                }
            }
        };

        fetchAllData();

        const unsubs = [
            subscribe('unread:update', fetchAllData),
            subscribe('request:new', fetchAllData)
        ];

        const refreshOnEvent = () => fetchAllData();
        window.addEventListener('stats-updated', refreshOnEvent);

        return () => {
            unsubs.forEach(u => u());
            window.removeEventListener('stats-updated', refreshOnEvent);
        };
    }, [token, user?.role, user?.id, dispatch, subscribe]);

    // Memoize links to avoid re-calculation on every render
    const links = useMemo((): SidebarLink[] => {
        const orgLinks: SidebarLink[] = [];

        if (!isApproved) {
            // Simplified links for non-approved orgs
            return orgLinks;
        }

        // Landing page link based on role
        let overviewHref = `/${orgSlug}/admin`;
        if (user?.role === Role.TEACHER || user?.role === Role.ORG_MANAGER) {
            overviewHref = `/${orgSlug}/teachers/${user.userName}`;
        } else if (user?.role === Role.STUDENT) {
            overviewHref = `/${orgSlug}/students/${user.userName}`;
        }

        orgLinks.push({ id: 'DASHBOARD', label: 'Overview', href: overviewHref, icon: LayoutDashboard });

        if (user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) {
            orgLinks.push({ id: 'COURSES', label: 'Courses', href: `/${orgSlug}/courses`, icon: LibraryBig, badge: stats?.COURSES });
            orgLinks.push({ id: 'SECTIONS', label: 'Sections', href: `/${orgSlug}/sections`, icon: Layers, badge: stats?.SECTIONS });
            orgLinks.push({ id: 'TEACHERS', label: 'Teachers', href: `/${orgSlug}/teachers`, icon: Users, badge: stats?.TEACHERS });
            orgLinks.push({ id: 'STUDENTS', label: 'Students', href: `/${orgSlug}/students`, icon: GraduationCap, badge: stats?.STUDENTS });
            if (user?.role === Role.ORG_ADMIN) {
                orgLinks.push({ id: 'SETTINGS', label: 'Settings', href: `/${orgSlug}/settings`, icon: Settings });
            }
            if (user?.role != Role.ORG_ADMIN) {
                orgLinks.push({ id: 'GRADES', label: 'Grades', href: `/${orgSlug}/grades`, icon: Trophy });
                orgLinks.push({ id: 'PROFILE', label: 'Profile Settings', href: `/${orgSlug}/teachers/${user.userName}/profile`, icon: Settings });
            }
        } else if (user?.role === Role.TEACHER) {
            orgLinks.push({ id: 'COURSES', label: 'My Courses', href: `/${orgSlug}/courses`, icon: LibraryBig, badge: stats?.COURSES });
            orgLinks.push({ id: 'SECTIONS', label: 'My Sections', href: `/${orgSlug}/sections`, icon: Layers, badge: stats?.SECTIONS });
            orgLinks.push({ id: 'STUDENTS', label: 'My Students', href: `/${orgSlug}/students`, icon: GraduationCap, badge: stats?.STUDENTS });
            orgLinks.push({ id: 'GRADES', label: 'Grades', href: `/${orgSlug}/grades`, icon: Trophy });
            orgLinks.push({ id: 'PROFILE', label: 'Profile Settings', href: `/${orgSlug}/teachers/${user.userName}/profile`, icon: Settings });
        } else if (user?.role === Role.STUDENT) {
            orgLinks.push({ id: 'COURSES', label: 'My Courses', href: `/${orgSlug}/students/${user.userName}?tab=courses`, icon: Book, badge: stats?.SECTIONS });
            orgLinks.push({ id: 'ASSESSMENTS', label: 'Assessments', href: `/${orgSlug}/students/${user.userName}?tab=assessments`, icon: BookOpen, badge: stats?.PENDING_ASSESSMENTS });
            orgLinks.push({ id: 'GRADES', label: 'Grades', href: `/${orgSlug}/students/${user.userName}?tab=grades`, icon: Trophy });
            orgLinks.push({ id: 'ATTENDANCE', label: 'Attendance', href: `/${orgSlug}/students/${user.userName}?tab=attendance`, icon: CheckCircle });
            orgLinks.push({ id: 'PROFILE', label: 'Profile Settings', href: `/${orgSlug}/students/${user.userName}?tab=profile`, icon: Settings });
        }

        return orgLinks;
    }, [isApproved, orgSlug, user, stats]);

    const bottomLinks: SidebarLink[] = [
        {
            id: 'MAIL',
            label: 'Mail',
            href: `/${orgSlug}/mail`,
            icon: MessageSquare,
            badge: state.stats.mail ? (state.stats.mail.unread > 0 ? `${state.stats.mail.unread} New / ${state.stats.mail.total}` : `${state.stats.mail.total}`) : undefined
        }
    ];

    const isMailPage = pathname.endsWith('/mail');
    const showOverlay = orgData && orgData.status !== OrgStatus.APPROVED && !isMailPage;

    // Determine brandHref (landing page)
    let brandHref = `/${orgSlug}/admin`;
    if (user?.role === Role.TEACHER || user?.role === Role.ORG_MANAGER) {
        brandHref = `/${orgSlug}/teachers/${user.userName}`;
    } else if (user?.role === Role.STUDENT) {
        brandHref = `/${orgSlug}/students/${user.userName}`;
    }

    return (
        <DashboardLayout
            links={links}
            bottomLinks={bottomLinks}
            brandHref={brandHref}
        >
            {showOverlay ? <StatusOverlay orgData={orgData!} user={user} orgSlug={orgSlug} /> : children}
        </DashboardLayout>
    );
}
