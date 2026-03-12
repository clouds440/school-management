'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout, SidebarLink } from '@/components/ui/DashboardLayout';
import { Building, MessageSquare, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { AdminStats, Role } from '@/types';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);

    useEffect(() => {
        if (token) {
            api.admin.getAdminStats(token)
                .then(setStats)
                .catch(err => console.error('Failed to fetch stats:', err));
        }
    }, [token]);

    // Memoize links to avoid re-calculation on every render
    const links = useMemo((): SidebarLink[] => {
        const adminLinks: SidebarLink[] = [
            {
                id: 'ORGANIZATIONS',
                label: 'Organizations',
                href: '/admin/dashboard/organizations',
                icon: Building,
                badge: stats ? (stats.PENDING + stats.APPROVED + stats.REJECTED + stats.SUSPENDED) : undefined
            },
        ];

        // Add platform admins link if user is a SUPER_ADMIN
        if (user?.role === Role.SUPER_ADMIN) {
            adminLinks.push({
                id: 'PLATFORM_ADMINS',
                label: 'Platform Admins',
                href: '/admin/dashboard/platform-admins',
                icon: Users,
                badge: stats?.PLATFORM_ADMINS
            });
        }

        // Add Support Mails link to main navigation
        adminLinks.push({
            id: 'SUPPORT',
            label: 'Support Mails',
            href: '/admin/dashboard/support',
            icon: MessageSquare,
            badge: stats?.SUPPORT
        });

        return adminLinks;
    }, [stats, user?.role]);

    const bottomLinks: SidebarLink[] = [];

    return (
        <DashboardLayout title="Admin Dashboard" links={links} bottomLinks={bottomLinks}>
            {children}
        </DashboardLayout>
    );
}
