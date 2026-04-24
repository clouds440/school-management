'use client';

import { useEffect } from 'react';
import { DashboardLayout, SidebarLink } from '@/components/ui/DashboardLayout';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap,
    MessageSquare, Settings, LibraryBig, Trophy,
    Clock, ShieldOff, RefreshCw, Mail, CheckCircle, Book,
    Layers,
    CalendarDays
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
const StatusOverlay = ({ orgData, user }: { orgData: Organization, user: JwtPayload | null }) => {
    if (!orgData) return null;

    if (orgData.status === OrgStatus.PENDING) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card/50 backdrop-blur-md rounded-lg shadow-xl border border-border text-center max-w-2xl mx-5 lg:mx-auto my-10">
                <div className="p-6 bg-yellow-50 rounded-full mb-6 relative">
                    <Clock className="w-20 h-20 text-yellow-500 animate-pulse" />
                    <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                </div>
                <h2 className="text-4xl font-black text-card-foreground mb-4 tracking-tight">Awaiting Approval</h2>
                <p className="text-muted-foreground text-lg mb-8 font-medium">
                    Your organization registration is currently being verified.
                    You&apos;ll have full access once EduVerse confirms your details.
                </p>
                <div className="bg-yellow-500 text-yellow-50 px-10 py-5 rounded-lg font-black text-xl border border-yellow-300 w-full shadow-2xl flex items-center justify-center gap-3">
                    Status: Pending Verification
                </div>
            </div>
        );
    }

    if (orgData.status === OrgStatus.REJECTED) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card/70 backdrop-blur-md rounded-lg shadow-xl border border-border text-center max-w-2xl mx-auto my-10">
                <div className="p-6 bg-red-50 rounded-full mb-6 relative">
                    <ShieldOff className="w-20 h-20 text-red-500" />
                    <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-10"></div>
                </div>
                <h2 className="text-4xl font-black text-card-foreground mb-4 tracking-tight italic">Application Denied</h2>
                <div className="bg-red-50 border border-red-100 p-8 rounded-lg mb-8 text-left w-full shadow-inner">
                    <p className="text-[10px] font-black text-red-400 tracking-[0.3em] mb-4">Official Rejection Reason</p>
                    <MarkdownRenderer
                        content={orgData.statusHistory && orgData.statusHistory.length > 0
                            ? orgData.statusHistory[orgData.statusHistory.length - 1].message
                            : 'No reason provided.'}
                        className="text-red-900 text-lg font-bold prose prose-red prose-sm max-w-none leading-relaxed"
                    />
                </div>
                <p className="text-muted-foreground text-base mb-10 font-medium max-w-md">
                    To regain access, please update your organization details based on the feedback above and submit your application again.
                </p>
                {user?.role === Role.ORG_ADMIN && (
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-4 bg-red-600 hover:bg-red-700 text-red-50 px-12 py-6 rounded-lg font-black text-xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] transition-all hover:-translate-y-1 active:scale-95 group tracking-tighter"
                    >
                        <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                        Status: RE-APPLY NOW
                    </Link>
                )}
            </div>
        );
    }

    if (orgData.status === OrgStatus.SUSPENDED) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card/70 backdrop-blur-md rounded-lg shadow-xl border border-border text-center max-w-2xl mx-auto my-10">
                <div className="p-6 bg-orange-50 rounded-full mb-6 relative">
                    <ShieldOff className="w-20 h-20 text-orange-500" />
                    <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-10"></div>
                </div>
                <h2 className="text-4xl font-black text-card-foreground mb-4 tracking-tight italic">Access Suspended</h2>
                <p className="text-muted-foreground text-lg mb-8 font-medium">
                    Your institutional access has been temporarily restricted by the platform administrators.
                </p>
                <div className="bg-orange-50 text-orange-800 p-8 rounded-lg border border-orange-100 w-full mb-10 text-left shadow-inner">
                    <h3 className="font-black mb-4 flex items-center gap-2 text-[10px] tracking-[0.3em] text-orange-900/60"><ShieldOff className="w-4 h-4" /> Official Suspension Reason</h3>
                    <MarkdownRenderer
                        content={orgData.statusHistory && orgData.statusHistory.length > 0
                            ? orgData.statusHistory[orgData.statusHistory.length - 1].message
                            : 'Please contact platform support for further details.'}
                        className="italic font-bold text-orange-900 prose prose-orange prose-sm max-w-none leading-relaxed"
                    />
                </div>
                <Link
                    href="/contact"
                    className="inline-flex items-center gap-4 bg-card hover:bg-muted text-foreground px-12 py-6 rounded-lg font-black text-xl shadow-2xl transition-all hover:-translate-y-1 group tracking-tighter border border-border"
                >
                    <Mail className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    Contact Platform Support
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
    const userProfile = state.auth.userProfile;
    const chatStats = state.stats.chat;
    const isApproved = orgData?.status === OrgStatus.APPROVED;

    const { subscribe } = useSocket({
        token: token,
        userId: user?.id,
        userRole: user?.role
    });

    useEffect(() => {
        let mounted = true;

        const fetchAllData = () => {
            // Prevent fetching if component has unmounted
            if (!mounted) return;

            // Check if token is still valid (not cleared from localStorage)
            const currentToken = localStorage.getItem('token');
            if (!currentToken) return;

            if (currentToken && (user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER || user?.role === Role.TEACHER || user?.role === Role.STUDENT)) {
                // Fetch Org Stats
                api.org.getStats(currentToken)
                    .then(data => { if (mounted) dispatch({ type: 'STATS_SET_ORG', payload: data }); })
                    .catch(err => console.error('Failed to fetch org stats:', err));

                // Fetch Org Data
                api.org.getOrgData(currentToken)
                    .then((data: Organization) => {
                        if (mounted) dispatch({ type: 'STATS_SET_ORG_DATA', payload: data });
                    })
                    .catch((err) => console.error('Failed to fetch org data:', err));

                // Fetch Mail Stats
                api.mail.getUnreadCount(currentToken)
                    .then(data => { if (mounted) dispatch({ type: 'STATS_SET_MAIL', payload: data }); })
                    .catch(err => console.error('Failed to fetch mail stats:', err));

                // Fetch Chat Stats
                api.chat.getUnreadCount(currentToken)
                    .then(data => { if (mounted) dispatch({ type: 'STATS_SET_CHAT', payload: data }); })
                    .catch(err => console.error('Failed to fetch chat stats:', err));

                // Fetch User Profile (if Teacher or Student)
                if ((user?.role === Role.TEACHER || user?.role === Role.STUDENT || user?.role === Role.ORG_MANAGER) && !userProfile) {
                    api.org.getProfile(currentToken)
                        .then(data => { if (mounted) dispatch({ type: 'AUTH_SET_PROFILE', payload: data as Teacher | Student }); })
                        .catch(err => console.error('Failed to fetch profile:', err));
                }
            }
        };

        fetchAllData();

        // Debounce global refreshes to avoid storms when socket events flood
        const timerRef: { current: number | null } = { current: null };
        const scheduleFetch = () => {
            if (!mounted) return;
            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => {
                if (mounted) fetchAllData();
                timerRef.current = null;
            }, 1000);
        };

        const unsubs = [
            subscribe('unread:update', scheduleFetch),
            subscribe('mail:new', scheduleFetch),
            subscribe('chat:message', scheduleFetch),
            subscribe('chat:read', scheduleFetch)
        ];

        const refreshOnEvent = () => scheduleFetch();
        window.addEventListener('stats-updated', refreshOnEvent);

        return () => {
            mounted = false;
            unsubs.forEach(u => u());
            window.removeEventListener('stats-updated', refreshOnEvent);
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [token, user?.role, user?.id, dispatch, subscribe, userProfile]);

    const links = (): SidebarLink[] => {
        const orgLinks: SidebarLink[] = [];

        if (!isApproved) {
            // Simplified links for non-approved orgs - Allow Settings if REJECTED for ORG_ADMIN
            if (orgData?.status === OrgStatus.REJECTED && user?.role === Role.ORG_ADMIN) {
                orgLinks.push({ id: 'SETTINGS', label: 'Settings', href: '/settings', icon: Settings });
            }
            return orgLinks;
        }

        // Landing page link based on role
        let overviewHref = '/overview';
        if (user?.role === Role.TEACHER || user?.role === Role.ORG_MANAGER) {
            overviewHref = `/teachers/${user.id}`;
        } else if (user?.role === Role.STUDENT) {
            overviewHref = `/students/${user.id}`;
        }

        // Common links for everyone
        orgLinks.push({ id: 'DASHBOARD', label: 'Overview', href: overviewHref, icon: LayoutDashboard });
        orgLinks.push({
            id: 'CHAT',
            label: 'Messages',
            icon: MessageSquare,
            href: '/chat',
            badge: chatStats && chatStats.unread > 0 ? `${chatStats.unread} New` : undefined
        });

        const isManagement = user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER;
        const isAcademic = user?.role === Role.TEACHER || user?.role === Role.ORG_MANAGER;

        // Management View (Admins & Managers)
        if (isManagement) {
            orgLinks.push({ id: 'COURSES', label: 'Courses', href: '/courses', icon: LibraryBig, badge: stats?.COURSES });
            orgLinks.push({ id: 'SECTIONS', label: 'Sections', href: '/sections', icon: Layers, badge: stats?.SECTIONS });
            orgLinks.push({ id: 'TEACHERS', label: 'Teachers', href: '/teachers', icon: Users, badge: stats?.TEACHERS });
            orgLinks.push({ id: 'STUDENTS', label: 'Students', href: '/students', icon: GraduationCap, badge: stats?.STUDENTS });
            orgLinks.push({ id: 'ATTENDANCE', label: 'Attendance', href: '/attendance', icon: CheckCircle });
            orgLinks.push({ id: 'SCHEDULES', label: 'Schedules', href: '/schedules', icon: CalendarDays });

            if (user?.role === Role.ORG_ADMIN) {
                orgLinks.push({ id: 'SETTINGS', label: 'Settings', href: '/settings', icon: Settings });
            }
        }

        // Academic/Teaching View (Teachers & Managers)
        if (user?.role === Role.TEACHER) {
            orgLinks.push({ id: 'COURSES', label: 'My Courses', href: '/courses', icon: LibraryBig, badge: stats?.COURSES });
            orgLinks.push({ id: 'SECTIONS', label: 'My Sections', href: '/sections', icon: Layers, badge: stats?.SECTIONS });
            orgLinks.push({ id: 'STUDENTS', label: 'My Students', href: '/students', icon: GraduationCap, badge: stats?.STUDENTS });
            orgLinks.push({ id: 'ATTENDANCE', label: 'Attendance', href: '/attendance', icon: CheckCircle });
        }

        // Shared Academic Features (Teachers and Managers, but not pure Admins unless explicitly handling classes)
        if (isAcademic && user?.role !== Role.ORG_ADMIN) {
            orgLinks.push({ id: 'TIMETABLE', label: 'Timetable', href: '/timetable', icon: Clock });
            orgLinks.push({ id: 'GRADES', label: 'Grades', href: '/grades', icon: Trophy });
            orgLinks.push({ id: 'PROFILE', label: 'Profile Settings', href: `/teachers/${user.id}/profile`, icon: Settings });
        }

        // Student View
        if (user?.role === Role.STUDENT) {
            orgLinks.push({ id: 'COURSES', label: 'My Courses', href: `/students/${user.id}?tab=courses`, icon: Book, badge: stats?.SECTIONS });
            orgLinks.push({ id: 'ASSESSMENTS', label: 'Assessments', href: `/students/${user.id}?tab=assessments`, icon: BookOpen, badge: stats?.PENDING_ASSESSMENTS });
            orgLinks.push({ id: 'GRADES', label: 'Grades', href: `/students/${user.id}?tab=grades`, icon: Trophy });
            orgLinks.push({ id: 'ATTENDANCE', label: 'Attendance', href: `/students/${user.id}?tab=attendance`, icon: CheckCircle });
            orgLinks.push({ id: 'TIMETABLE', label: 'Timetable', href: '/timetable', icon: Clock });
            orgLinks.push({ id: 'PROFILE', label: 'Profile Settings', href: `/students/${user.id}?tab=profile`, icon: Settings });
        }

        return orgLinks;
    };

    const bottomLinks: SidebarLink[] = [
        {
            id: 'MAIL',
            label: 'Mail',
            href: '/mail',
            icon: Mail,
            badge: state.stats.mail && state.stats.mail.unread > 0 ? `${state.stats.mail.unread} New` : undefined
        }
    ];

    // Determine high-level dashboard pages for padding
    const isOrgAdmin = pathname === '/overview';
    const isGrades = pathname === '/grades' || pathname.includes('tab=grades');

    let overviewHref = '/settings';
    if (user?.role === Role.TEACHER || user?.role === Role.ORG_MANAGER) {
        overviewHref = `/teachers/${user.id}`;
    } else if (user?.role === Role.STUDENT) {
        overviewHref = `/students/${user.id}`;
    }
    const isOverview = pathname === overviewHref;

    const showPadding = isOrgAdmin || isGrades || isOverview;

    // Check if the current route is allowed for non-approved organizations
    const allowedSubPaths = ['settings', 'change-password'];
    const isAllowedRoute = allowedSubPaths.some(sub => pathname === `/${sub}`);

    return (
        <DashboardLayout
            links={links()}
            bottomLinks={bottomLinks}
            showPadding={showPadding}
        >
            {!isApproved && !isAllowedRoute ? (
                <StatusOverlay orgData={orgData!} user={user} />
            ) : (
                children
            )}
        </DashboardLayout>
    );
}
