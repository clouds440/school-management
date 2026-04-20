'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useGlobal } from '@/context/GlobalContext';
import { Section, FinalGradeResponse, Student, ApiError, Role, Assessment } from '@/types';
import { ShieldOff, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { Loading } from '@/components/ui/Loading';

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

    const orgName = (params?.orgName as string) || '';

    const [sections, setSections] = useState<Section[]>([]);
    const [grades, setGrades] = useState<FinalGradeResponse[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const fetchingData = state.ui.isLoading;

    const profile = state.auth.userProfile as Student | null;

    useEffect(() => {
        if (!token || !user) return;

        // Scroll to section if hash is present
        const hash = window.location.hash;
        if (hash) {
            const elementId = hash.substring(1); // Remove the # symbol
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // Role Guard: Only Student self-view, ORG_ADMIN, or ORG_MANAGER
        // We can add TEACHER check later if needed, but for now strict access.
        const isAuthorized =
            user.role === Role.ORG_ADMIN ||
            user.role === Role.ORG_MANAGER ||
            (user.role === Role.STUDENT && user.userName === params.userName);

        if (!isAuthorized) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Access Denied. You are not authorized to view this portal.', type: 'error' } });
            const nameSlug = user.name ? user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : 'dashboard';
            const redirectPath = user.role === Role.STUDENT
                ? `/${orgName}/students/${user.userName}`
                : `/${orgName}/${user.role === Role.ORG_ADMIN ? 'admin' : `teachers/${nameSlug}`}`;

            router.replace(redirectPath);
            return;
        }

        const fetchData = async () => {
            dispatch({ type: 'UI_SET_LOADING', payload: true });

            try {
                const [sectionsRes, gradesRes, assessmentsRes] = await Promise.all([
                    api.org.getSections(token, { my: true }).catch(() => ({ data: [] })),
                    api.org.getOwnFinalGrades(token).catch(() => []),
                    api.org.getAssessments(token).catch(() => [])
                ]);

                setSections(sectionsRes.data || []);
                setGrades(gradesRes || []);
                setAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : []);
            } catch (err: unknown) {
                const apiError = err as ApiError;
                if (apiError?.response?.data?.message === 'Silent') return; // Custom check if needed
                console.error('Failed to fetch other student data:', err);
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load some data. Please try again.', type: 'error' } });
            } finally {
                dispatch({ type: 'UI_SET_LOADING', payload: false });
            }
        };

        fetchData();
    }, [token, dispatch, orgName, user, params.userName, router]);

    if (!user) return null;

    if (user.status === 'SUSPENDED') {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card/70 backdrop-blur-md rounded-lg shadow-2xl border border-orange-500/20 text-center max-w-2xl mx-auto mt-10">
                <ShieldOff className="w-20 h-20 text-orange-500 mb-6" />
                <h2 className="text-4xl font-black text-foreground mb-4">Account Suspended</h2>
                <p className="text-muted-foreground text-lg mb-8">
                    Your account has been temporarily suspended by the administration. Please contact the office for details.
                </p>
                <Link
                    href={`/${orgName}/mail`}
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    Contact Support
                </Link>
            </div>
        );
    }

    if (fetchingData || state.auth.loading) {
        return (
            <div className="flex flex-1 items-center justify-center h-full py-20">
                <Loading size="lg" />
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full">
            {user.status === 'ALUMNI' && (
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
                {tab === 'overview' && <Overview sections={sections} grades={grades} assessments={assessments} />}
                {tab === 'courses' && <Courses sections={sections} />}
                {tab === 'assessments' && <Assessments assessments={assessments} sections={sections} />}
                {tab === 'grades' && <Grades grades={grades} />}
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