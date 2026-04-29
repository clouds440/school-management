'use client';

import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { DashboardInsights } from '@/types';
import { Loading } from '@/components/ui/Loading';
import InsightsOverview from '@/components/dashboard/InsightsOverview';

export default function AdminPage() {
    const { token, loading } = useAuth();

    // SWR for insights with refreshInterval for live dashboard feel
    const insightsKey = token ? ['insights'] as const : null;
    const { data: insights, isLoading: insightsLoading } = useSWR<DashboardInsights>(insightsKey, {
        refreshInterval: 30000, // 30 seconds for live dashboard feel
    });

    if (loading || insightsLoading) {
        return <Loading className="h-full" text="Loading live organization insights..." size="lg" />;
    }

    if (!insights) return null;

    return <InsightsOverview insights={insights} />;
}
