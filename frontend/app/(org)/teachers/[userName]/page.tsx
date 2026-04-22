'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { DashboardInsights } from '@/types';
import { Loading } from '@/components/ui/Loading';
import InsightsOverview from '@/components/dashboard/InsightsOverview';

export default function TeacherLandingPage() {
    const { token, loading } = useAuth();
    const [insights, setInsights] = useState<DashboardInsights | null>(null);

    useEffect(() => {
        if (!token) return;

        api.org.getInsights(token)
            .then(setInsights)
            .catch((error) => console.error('Failed to fetch teacher insights:', error));
    }, [token]);

    if (loading || !insights) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <Loading size="lg" />
            </div>
        );
    }

    return <InsightsOverview insights={insights} />;
}
