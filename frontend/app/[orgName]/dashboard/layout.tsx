'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout, SidebarLink } from '@/components/ui/DashboardLayout';
import { LayoutDashboard, Users, BookOpen, GraduationCap, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { api, OrgStats } from '@/src/lib/api';

export default function OrgDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [stats, setStats] = useState<OrgStats | null>(null);
    const [isApproved, setIsApproved] = useState(user?.status === 'APPROVED' || user?.status === undefined);
    const orgSlug = pathname.split('/')[1] || user?.orgSlug || 'organization';

    useEffect(() => {
        if (token && (user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER' || user?.role === 'TEACHER' || user?.role === 'STUDENT')) {
            api.org.getStats(token)
                .then(setStats)
                .catch(err => console.error('Failed to fetch org stats:', err));

            api.org.getSettings(token)
                .then((data) => {
                    const approved = data.status === 'APPROVED';
                    setIsApproved(approved);

                    if (!approved && pathname !== `/${orgSlug}/dashboard`) {
                        router.replace(`/${orgSlug}/dashboard`);
                    }
                })
                .catch(err => console.error('Failed to fetch org settings:', err));
        }
    }, [token, user?.role, pathname, orgSlug, router]);

    // Memoize links to avoid re-calculation on every render
    const links = useMemo((): SidebarLink[] => {
        const orgLinks: SidebarLink[] = [];

        if (!isApproved) {
            orgLinks.push({ id: 'DASHBOARD', label: 'Overview', href: `/${orgSlug}/dashboard`, icon: LayoutDashboard });
            return orgLinks;
        }

        orgLinks.push({ id: 'DASHBOARD', label: 'Overview', href: `/${orgSlug}/dashboard`, icon: LayoutDashboard });

        if (user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER') {
            orgLinks.push({ id: 'TEACHERS', label: 'Teachers', href: `/${orgSlug}/dashboard/teachers`, icon: Users, badge: stats?.TEACHERS });
            orgLinks.push({ id: 'CLASSES', label: 'Classes', href: `/${orgSlug}/dashboard/classes`, icon: BookOpen, badge: stats?.CLASSES });
            orgLinks.push({ id: 'STUDENTS', label: 'Students', href: `/${orgSlug}/dashboard/students`, icon: GraduationCap, badge: stats?.STUDENTS });
            orgLinks.push({ id: 'SETTINGS', label: 'Settings', href: `/${orgSlug}/settings`, icon: Settings });
        } else if (user?.role === 'TEACHER') {
            orgLinks.push({ id: 'CLASSES', label: 'My Classes', href: `/${orgSlug}/dashboard/classes`, icon: BookOpen, badge: stats?.CLASSES });
            orgLinks.push({ id: 'STUDENTS', label: 'My Students', href: `/${orgSlug}/dashboard/students`, icon: GraduationCap, badge: stats?.STUDENTS });
        } else if (user?.role === 'STUDENT') {
            orgLinks.push({ id: 'CLASSES', label: 'My Classes', href: `/${orgSlug}/dashboard/classes`, icon: BookOpen, badge: stats?.CLASSES });
        }

        return orgLinks;
    }, [isApproved, orgSlug, user?.role, stats]);

    const bottomLinks: SidebarLink[] = [
        { id: 'SUPPORT', label: 'Support', href: `/support`, icon: MessageSquare }
    ];

    return (
        <DashboardLayout title="Dashboard" links={links} bottomLinks={bottomLinks}>
            {children}
        </DashboardLayout>
    );
}
