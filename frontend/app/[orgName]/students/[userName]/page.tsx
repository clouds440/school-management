'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    LayoutDashboard,
    User,
    Book,
    Trophy,
    CheckCircle,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Student, Section, FinalGrade, Announcement } from '@/types';
import { ResourceTabs } from '@/components/ui/ResourceTabs';
import { getPublicUrl } from '@/lib/utils';

// Import Tab Components
import OverviewTab from './_components/OverviewTab';
import CoursesTab from './_components/CoursesTab';
import AttendanceTab from './_components/AttendanceTab';
import GradesTab from './_components/GradesTab';
import ProfileTab from './_components/ProfileTab';

export default function StudentDetailPage() {
    const { token, user: currentUser } = useAuth();
    const params = useParams();

    const [activeTab, setActiveTab] = useState('overview');
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    // Data for tabs
    const [sections, setSections] = useState<Section[]>([]);
    const [finalGrades, setFinalGrades] = useState<FinalGrade[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    const orgSlug = params.orgName as string;
    const userName = params.userName as string;

    const tabs = useMemo(() => [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'profile', label: 'Profile Settings', icon: User },
        { id: 'courses', label: 'Courses', icon: Book },
        { id: 'grades', label: 'Grades', icon: Trophy },
        { id: 'attendance', label: 'Attendance', icon: CheckCircle },
    ], []);

    useEffect(() => {
        if (!token || !userName) return;

        setLoading(true);

        // Fetch base student info
        const fetchStudent = currentUser?.userName === userName
            ? api.org.getProfile(token).then(setStudent)
            : api.org.getStudents(token, { search: userName }).then(res => {
                const found = res.data.find(s => s.user.userName === userName);
                setStudent(found || null);
            });

        // Fetch overview/dashboard data
        const fetchData = Promise.all([
            api.org.getSections(token, { my: true }),
            api.org.getOwnFinalGrades(token),
        ]).then(([sectionsRes, gradesRes]) => {
            setSections(sectionsRes.data || []);
            setFinalGrades(gradesRes || []);
        });

        Promise.all([fetchStudent, fetchData]).finally(() => setLoading(false));
    }, [token, userName, currentUser]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-2xl font-black uppercase tracking-tight text-card-text/40 italic">Student Not Found</h2>
                <Link href={`/${orgSlug}/students`} className="text-primary font-black uppercase tracking-widest mt-4 inline-block hover:underline">Return to Directory</Link>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab
                    sections={sections}
                    finalGrades={finalGrades}
                    announcements={announcements}
                    orgSlug={orgSlug}
                    userName={userName}
                    onTabChange={setActiveTab}
                />;
            case 'courses':
                return <CoursesTab token={token!} />;
            case 'attendance':
                return <AttendanceTab />;
            case 'grades':
                return <GradesTab token={token!} />;
            case 'profile':
                return <ProfileTab student={student} orgSlug={orgSlug} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            {/* Header / Breadcrumb */}
            <div className="mb-8 flex items-center justify-between">
                <Link
                    href={`/${orgSlug}/students`}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-card-text/40 hover:text-primary transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Student Database
                </Link>
            </div>

            {/* Student Header Card */}
            <div className="bg-card text-card-text rounded-sm shadow-2xl border border-white/20 p-8 md:p-12 mb-8 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="shrink-0">
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-sm border-2 border-white/10 shadow-2xl overflow-hidden bg-primary/5 flex items-center justify-center relative group/avatar">
                            {student.user.avatarUrl ? (
                                <Image
                                    src={getPublicUrl(student.user.avatarUrl)}
                                    alt={student.user.name}
                                    width={144}
                                    height={144}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                                    unoptimized
                                />
                            ) : (
                                <User className="w-12 h-12 md:w-20 h-20 text-primary/10" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
                            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                                {student.user.name}
                            </h1>
                            <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] italic rounded-sm self-center md:self-auto mb-1 shadow-lg">
                                REG: {student.registrationNumber || student.id.substring(0, 8).toUpperCase()}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-card-text/30">
                            <div className="flex items-center gap-3">
                                <Book className="w-4 h-4 text-primary" />
                                <span className="text-card-text/60">{student.major || 'UNDECLARED MAJOR'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-primary" />
                                <span className="text-card-text/60">ROLL: {student.rollNumber || '000'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Trophy className="w-4 h-4 text-primary" />
                                <span className={`px-2 py-0.5 rounded-sm bg-primary/5 ${student.status === 'active' ? 'text-emerald-500' : 'text-primary'}`}>
                                    {student.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabbed Navigation */}
            <ResourceTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Rendered View */}
            <div className="flex-1 w-full bg-slate-50/30 rounded-sm p-4 md:p-6 min-h-[400px]">
                {renderTabContent()}
            </div>
        </div>
    );
}