'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useSWR from 'swr';
import { useGlobal } from '@/context/GlobalContext';
import { Section, FinalGradeResponse, Student, Role, Assessment, DashboardInsights, PaginatedResponse } from '@/types';
import { ShieldOff, GraduationCap } from 'lucide-react';
import { Loading } from '@/components/ui/Loading';
import { NotFound } from '@/components/NotFound';

import Overview from './_components/Overview';
import Courses from './_components/Courses';
import Grades from './_components/Grades';
import Attendance from './_components/Attendance';
import Profile from './_components/Profile';
import Assessments from './_components/Assessments';

function StudentPortalContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'overview';
    const { user, token } = useAuth();
    const { state, dispatch } = useGlobal();

    const profile = state.auth.userProfile as Student | null;
    const userId = params.userId as string;

    // SWR: Validation fetch (runs in parallel with data, NOT blocking)
    const validationKey = token && userId ? ['validate-student', userId] as const : null;
    const { data: studentData, error: validationError, isLoading: validating } = useSWR<Student>(validationKey);

    // SWR: Data fetches (run in parallel, NOT gated on validation)
    const shouldFetchData = token && user;

    const sectionsKey = shouldFetchData ? ['student-sections', { my: true }] as const : null;
    const { data: sectionsData, isLoading: sectionsLoading } = useSWR<PaginatedResponse<Section>>(sectionsKey);

    const gradesKey = shouldFetchData && user?.id ? ['student-grades', user.id] as const : null;
    const { data: grades, isLoading: gradesLoading } = useSWR<FinalGradeResponse[]>(gradesKey);

    const assessmentsKey = shouldFetchData ? ['student-assessments', {}] as const : null;
    const { data: assessments, isLoading: assessmentsLoading } = useSWR<Assessment[]>(assessmentsKey);

    const insightsKey = shouldFetchData ? ['student-insights'] as const : null;
    const { data: insights, isLoading: insightsLoading } = useSWR<DashboardInsights>(insightsKey);

    // Derived states
    const studentExists = validationError ? false : (studentData ? true : null);
    const isDataLoading = sectionsLoading || gradesLoading || assessmentsLoading || insightsLoading;
    const sections = sectionsData?.data || [];

    // Handle hash scroll
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const elementId = hash.substring(1);
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, []);

    // Authorization effect - handles redirects based on validation and role
    useEffect(() => {
        if (!user || !studentData) return;

        const isAuthorized = user.role === Role.STUDENT && user.id === userId;

        if (!isAuthorized) {
            if (user.role === Role.ORG_ADMIN || user.role === Role.ORG_MANAGER) {
                router.push(`/students/edit/${studentData.id}`);
            } else {
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Access Denied. You are not authorized to view this portal.', type: 'error' } });
            }
        }
    }, [user, studentData, userId, router, dispatch]);

    if (validating) {
        return (
            <div className="flex flex-1 items-center justify-center h-full py-20">
                <Loading size="lg" />
            </div>
        );
    }

    if (studentExists === false) {
        return <NotFound page="Student" />;
    }

    if (user?.status === 'SUSPENDED') {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card/70 backdrop-blur-md rounded-lg shadow-2xl border border-orange-500/20 text-center max-w-2xl mx-auto mt-10">
                <ShieldOff className="w-20 h-20 text-orange-500 mb-6" />
                <h2 className="text-4xl font-black text-foreground mb-4">Account Suspended</h2>
                <p className="text-muted-foreground text-lg mb-8">
                    Your account has been temporarily suspended by the administration. Please contact your Administration for details.
                </p>
            </div>
        );
    }

    if (isDataLoading || state.auth.loading) {
        return (
            <div className="flex flex-1 items-center justify-center h-full py-20">
                <Loading size="lg" />
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full">
            {user?.status === 'ALUMNI' && (
                <div className="flex flex-col items-center justify-center p-12 bg-card/70 backdrop-blur-md rounded-lg shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-blue-500/20 text-center max-w-2xl mx-auto mb-10 hover:shadow-2xl transition-all duration-500">
                    <div className="p-6 bg-blue-500/10 rounded-full mb-6">
                        <GraduationCap className="w-20 h-20 text-blue-500" />
                    </div>
                    <h2 className="text-4xl font-black text-foreground mb-4 tracking-tight">Alumni Access</h2>
                    <p className="text-muted-foreground text-lg mb-8 font-medium">
                        You are viewing as an alumnus. Some features like active courses are not available.
                    </p>
                </div>
            )}

            <div className="mt-4">
                {tab === 'overview' && <Overview insights={insights || null} />}
                {tab === 'courses' && <Courses sections={sections} />}
                {tab === 'assessments' && <Assessments assessments={assessments || []} sections={sections} />}
                {tab === 'grades' && <Grades grades={grades || []} />}
                {tab === 'attendance' && <Attendance />}
                {tab === 'profile' && <Profile profile={profile} />}
            </div>
        </div>
    );
}

export default function StudentOverviewPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-1 items-center justify-center h-full">
                <Loading size="lg" />
            </div>
        }>
            <StudentPortalContent />
        </Suspense>
    );
}
