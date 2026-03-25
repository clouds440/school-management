'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Section, FinalGradeResponse, Student, ApiError, Role } from '@/types';
import { useToast } from '@/context/ToastContext';
import { ShieldOff, GraduationCap } from 'lucide-react';
import Link from 'next/link';

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
    const { showToast } = useToast();

    const orgName = (params?.orgName as string) || '';

    const [sections, setSections] = useState<Section[]>([]);
    const [grades, setGrades] = useState<FinalGradeResponse[]>([]);
    const [profile, setProfile] = useState<Student | null>(null);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || !user) return;

        // Role Guard: Only Student self-view, ORG_ADMIN, or ORG_MANAGER
        // We can add TEACHER check later if needed, but for now strict access.
        const isAuthorized = 
            user.role === Role.ORG_ADMIN || 
            user.role === Role.ORG_MANAGER || 
            (user.role === Role.STUDENT && user.userName === params.userName);

        if (!isAuthorized) {
            showToast('Access Denied. You are not authorized to view this portal.', 'error');
            const nameSlug = user.name ? user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : 'dashboard';
            const redirectPath = user.role === Role.STUDENT 
                ? `/${orgName}/students/${user.userName}`
                : `/${orgName}/${user.role === Role.ORG_ADMIN ? 'admin' : `teachers/${nameSlug}`}`;
            
            router.replace(redirectPath);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            let fetchedProfile: Student | null = null;

            try {
                fetchedProfile = await api.org.getProfile<Student>(token);
                setProfile(fetchedProfile);
            } catch (error: unknown) {
                const apiError = error as ApiError;
                console.error('Failed to fetch student profile:', error);
                const message = apiError?.response?.data?.message || 'Failed to load profile. Please try again.';
                showToast(Array.isArray(message) ? message[0] : message, 'error');
                setProfile(null); // Ensure profile is null on error
            }

            try {
                const [sectionsRes, gradesRes, assessmentsRes] = await Promise.all([
                    api.org.getSections(token, { my: true }).catch(() => ({ data: [] })),
                    api.org.getOwnFinalGrades(token).catch(() => []),
                    api.org.getAssessments(token).catch(() => [])
                ]);

                setSections(sectionsRes.data || []);
                setGrades(gradesRes || []);
                setAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : []);
            } catch (err: any) {
                if (err.isSilent) return;
                console.error('Failed to fetch other student data:', err);
                showToast('Failed to load some data. Please try again.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, showToast]);

    if (!user) return null;

    if (user.status === 'SUSPENDED') {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-2xl border border-orange-200 text-center max-w-2xl mx-auto mt-10">
                <ShieldOff className="w-20 h-20 text-orange-500 mb-6" />
                <h2 className="text-4xl font-black text-gray-900 mb-4">Account Suspended</h2>
                <p className="text-gray-600 text-lg mb-8">
                    Your account has been temporarily suspended by the administration. Please contact the office for details.
                </p>
                <Link
                    href={`/support`}
                    className="bg-gray-900 text-white px-8 py-4 rounded-sm font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    Contact Support
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full">
            {user.status === 'ALUMNI' && (
                <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-blue-200 text-center max-w-2xl mx-auto mb-10 hover:shadow-2xl transition-all duration-500">
                    <div className="p-6 bg-blue-50 rounded-full mb-6">
                        <GraduationCap className="w-20 h-20 text-blue-500" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Alumni Access</h2>
                    <p className="text-gray-600 text-lg mb-8 font-medium">
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
                {tab === 'profile' && <Profile profile={profile} orgSlug={orgName} />}
            </div>
        </div>
    );
}

export default function StudentOverviewPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-1 items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <StudentPortalContent />
        </Suspense>
    );
}