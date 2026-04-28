'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useGlobal } from '@/context/GlobalContext';
import { Section, FinalGradeResponse, Student, Role, Assessment, DashboardInsights } from '@/types';
import { ShieldOff, GraduationCap } from 'lucide-react';
import Link from 'next/link';
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

    const [sections, setSections] = useState<Section[]>([]);
    const [grades, setGrades] = useState<FinalGradeResponse[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [insights, setInsights] = useState<DashboardInsights | null>(null);
    const [fetchingData, setFetchingData] = useState(false);
    const [studentExists, setStudentExists] = useState<boolean | null>(null);
    const [validating, setValidating] = useState(true);

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

        // Validate that the student exists in the database and check authorization
        const validateStudentExists = async () => {
            setValidating(true);
            try {
                // Fetch student by userId to validate existence and get student record
                const student = await api.org.getStudentByUserId(params.userId as string, token);

                // Role Guard: Only Student self-view
                const isAuthorized = user.role === Role.STUDENT && user.id === params.userId;

                if (!isAuthorized) {
                    if (user.role === Role.ORG_ADMIN || user.role === Role.ORG_MANAGER) {
                        router.push(`/students/edit/${student.id}`);
                        return;
                    } else {
                        setStudentExists(false);
                        dispatch({ type: 'TOAST_ADD', payload: { message: 'Access Denied. You are not authorized to view this portal.', type: 'error' } });
                        return;
                    }
                }

                // Only set studentExists to true after authorization passes
                setStudentExists(!!student);
            } catch (error) {
                console.warn('Failed to fetch student:', error);
                setStudentExists(false);
            } finally {
                setValidating(false);
            }
        };

        validateStudentExists();

        const fetchData = async () => {
            setFetchingData(true);

            try {
                const [sectionsData, gradesData, assessmentsData, insightsData] = await Promise.all([
                    api.org.getSections(token, { my: true }),
                    api.org.getStudentFinalGrades(token, user.id),
                    api.org.getAssessments(token, {}),
                    api.org.getInsights(token),
                ]);

                setSections(sectionsData.data || []);
                setGrades(gradesData);
                setAssessments(assessmentsData);
                setInsights(insightsData);
            } catch (err) {
                console.warn('Failed to fetch other student data:', err);
            } finally {
                setFetchingData(false);
            }
        };

        fetchData();
    }, [token, dispatch, user, params.userId]);

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

    if (fetchingData || state.auth.loading) {
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
                {tab === 'overview' && <Overview insights={insights} />}
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
