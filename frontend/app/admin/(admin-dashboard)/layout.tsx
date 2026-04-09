'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout, SidebarLink } from '@/components/ui/DashboardLayout';
import { Building, Mail, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import statsStore from '@/lib/statsStore';
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
        if (!token) return;
        statsStore.fetchAll(token)
            .then(({ admin, chat }) => {
                if (admin) dispatch({ type: 'STATS_SET_ADMIN', payload: admin });
                if (chat) dispatch({ type: 'STATS_SET_CHAT', payload: chat });
            })
            .catch(err => console.error('Failed to fetch stats via statsStore:', err));
    }, [token, dispatch]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // WebSocket: Refresh stats on mail activity
    useEffect(() => {
        if (!token) return;

        // Debounce full fetches to avoid storms
        let debounceTimer: any | null = null;
        const debouncedFetch = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => fetchStats(), 800);
        };

        const unsub1 = subscribe('unread:update', () => {
            // unread:update may indicate mail count changes — do a debounced full fetch
            debouncedFetch();
        });

        const unsub2 = subscribe('chat:message', () => {
            // apply lightweight delta to chat unread count
            statsStore.applyChatMessageDelta(1);
            const chat = statsStore.getChat();
            if (chat) dispatch({ type: 'STATS_SET_CHAT', payload: chat });
        });

        const unsub3 = subscribe('chat:read', () => {
            statsStore.applyChatReadDelta(1);
            const chat = statsStore.getChat();
            if (chat) dispatch({ type: 'STATS_SET_CHAT', payload: chat });
        });

        return () => {
            unsub1(); unsub2(); unsub3();
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [subscribe, fetchStats, token, dispatch]);

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
            badge: state.stats.chat && state.stats.chat.unread > 0 ? `${state.stats.chat.unread} New` : undefined
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
