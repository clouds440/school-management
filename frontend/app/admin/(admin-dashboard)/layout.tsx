'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardLayout, SidebarLink } from '@/components/ui/DashboardLayout';
import { Building, Mail, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { AdminStats, Role } from '@/types';
import { useSocket } from '@/hooks/useSocket';
import { useGlobal } from '@/context/GlobalContext';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const { state, dispatch } = useGlobal();
    const stats = state.stats.admin;

    const { subscribe } = useSocket({
        token: token,
        userId: user?.id,
        userRole: user?.role
    });

    const fetchStats = useCallback(() => {
        if (token) {
            api.admin.getAdminStats(token)
                .then(data => dispatch({ type: 'STATS_SET_ADMIN', payload: data }))
                .catch(err => console.error('Failed to fetch stats:', err));
        }
    }, [token, dispatch]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // WebSocket: Refresh stats on mail activity
    useEffect(() => {
        const unsubscribe = subscribe('unread:update', () => {
            fetchStats();
        });
        return () => unsubscribe();
    }, [subscribe, fetchStats]);

    // Memoize links to avoid re-calculation on every render
    const links = useMemo((): SidebarLink[] => {
        const adminLinks: SidebarLink[] = [
            {
                id: 'ORGANIZATIONS',
                label: 'Organizations',
                href: '/admin/organizations',
                icon: Building,
                badge: stats ? (stats.PENDING + stats.APPROVED + stats.REJECTED + stats.SUSPENDED) : undefined
            },
        ];

        // Add platform admins link if user is a SUPER_ADMIN
        if (user?.role === Role.SUPER_ADMIN) {
            adminLinks.push({
                id: 'PLATFORM_ADMINS',
                label: 'Platform Admins',
                href: '/admin/platform-admins',
                icon: Users,
                badge: stats?.PLATFORM_ADMINS
            });
        }

        // Add Requests link to main navigation
        adminLinks.push({
            id: 'MAIL',
            label: 'Mail',
            href: '/admin/mail',
            icon: Mail,
            // Show [Unread / Total] in the badge or just Total? 
            // The user said "that count needs to show total count too, not just unread/new"
            // We'll show "Unread / Total" if unread > 0, otherwise just Total?
            // Actually usually a badge is just a number. We'll show Total as requested.
            badge: stats ? `${stats.UNREAD_MAIL} New / ${stats.TOTAL_MAIL} Total` : undefined
        });

        return adminLinks;
    }, [stats, user?.role]);

    const bottomLinks: SidebarLink[] = [];

    return (
        <DashboardLayout links={links} bottomLinks={bottomLinks}>
            {children}
        </DashboardLayout>
    );
}
