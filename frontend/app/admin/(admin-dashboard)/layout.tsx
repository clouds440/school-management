'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout, SidebarLink } from '@/components/ui/DashboardLayout';
import { Building, Mail, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Role } from '@/types';
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

            api.chat.getUnreadCount(token)
                .then(data => dispatch({ type: 'STATS_SET_CHAT', payload: data }))
                .catch(err => console.error('Failed to fetch chat stats:', err));
        }
    }, [token, dispatch]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // WebSocket: Refresh stats on mail activity
    useEffect(() => {
        const unsubs = [
            subscribe('unread:update', () => fetchStats()),
            subscribe('chat:message', () => fetchStats()),
            subscribe('chat:read', () => fetchStats())
        ];
        return () => unsubs.forEach(u => u());
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
            badge: stats?.UNREAD_MAIL ? `${stats.UNREAD_MAIL} New` : undefined
        });

        // Add Chat/Messages link
        adminLinks.push({
            id: 'CHAT',
            label: 'Messages',
            href: '/admin/chat',
            icon: MessageSquare,
            badge: undefined
        });

        return adminLinks;
    }, [stats, user?.role, state.stats.chat?.unread]);

    const bottomLinks: SidebarLink[] = [];

    return (
        <DashboardLayout
            links={links}
            bottomLinks={bottomLinks}
        >
            {children}
        </DashboardLayout>
    );
}
