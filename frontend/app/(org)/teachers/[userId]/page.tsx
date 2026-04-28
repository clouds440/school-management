'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { DashboardInsights, Role } from '@/types';
import { Loading } from '@/components/ui/Loading';
import InsightsOverview from '@/components/dashboard/InsightsOverview';
import { NotFound } from '@/components/NotFound';

export default function TeacherLandingPage() {
    const { token, loading, user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const { dispatch } = useGlobal();
    const [insights, setInsights] = useState<DashboardInsights | null>(null);
    const [teacherExists, setTeacherExists] = useState<boolean | null>(null);

    const userId = params.userId as string;

    useEffect(() => {
        if (!token || !user) return;

        const validateAndFetch = async () => {
            try {
                // Fetch teacher by userId to validate existence and get teacher record
                const teacher = await api.org.getTeacherByUserId(userId, token);
                setTeacherExists(true);

                // Check authorization
                if (user.id !== userId) {
                    if (user.role === Role.ORG_ADMIN || user.role === Role.ORG_MANAGER) {
                        // Redirect to edit page for admins/managers
                        router.replace(`/teachers/edit/${teacher.id}`);
                        return;
                    } else {
                        // Unauthorized access
                        dispatch({ type: 'TOAST_ADD', payload: { message: 'You do not have permission to view this teacher profile.', type: 'error' } });
                        setTeacherExists(false);
                        return;
                    }
                }

                // Fetch insights only if viewing own profile
                const insightsData = await api.org.getInsights(token);
                setInsights(insightsData);
            } catch (error) {
                console.warn('Failed to fetch teacher:', error);
                setTeacherExists(false);
            }
        };

        validateAndFetch();
    }, [token, user, userId, router, dispatch]);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <Loading size="lg" />
            </div>
        );
    }

    if (teacherExists === false) {
        return <NotFound page="Teacher" />;
    }

    if (!insights) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <Loading size="lg" />
            </div>
        );
    }

    return <InsightsOverview insights={insights} />;
}
