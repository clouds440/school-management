'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Users, BookOpen, FileText, PlusCircle, ShieldCheck,
    TrendingUp, Award, Clock, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useGlobal } from '@/context/GlobalContext';
import { Teacher, ApiError, Role, Section, Assessment } from '@/types';
import { formatDate } from '@/lib/utils';
import { BrandIcon } from '@/components/ui/Brand';
import { Loading } from '@/components/ui/Loading';


export default function TeacherLandingPage() {
    const { user: payload, loading, token } = useAuth();
    const { state, dispatch } = useGlobal();
    const [sections, setSections] = useState<Section[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const fetchingData = state.ui.isLoading;

    const orgData = state.stats.orgData;
    const teacher = state.auth.userProfile as Teacher | null;

    const fetchData = useCallback(async () => {
        if (!token) return;
        dispatch({ type: 'UI_SET_LOADING', payload: true });
        try {
            const [sectionsData, assessmentsData] = await Promise.all([
                api.org.getSections(token, { my: true }),
                api.org.getAssessments(token),
            ]);

            setSections(sectionsData.data);
            setAssessments(assessmentsData);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            console.error('Failed to fetch teacher data:', error);
            const message = apiError?.response?.data?.message || 'Failed to load data. Please try again.';
            dispatch({ type: 'TOAST_ADD', payload: { message: Array.isArray(message) ? message[0] : message, type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_LOADING', payload: false });
        }
    }, [token, dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || fetchingData) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <Loading size="lg" />
            </div>
        );
    }

    if (!payload) return null;

    // Use fetched profile if available, fallback to JWT payload
    const displayUser = teacher?.user || payload;
    const displayName = displayUser.name || displayUser.email;

    const totalStudents = sections.reduce((acc, s) => acc + (s.studentsCount || s.students?.length || 0), 0);
    const upcomingAssessments = assessments
        .filter(a => a.dueDate && new Date(a.dueDate) > new Date())
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 3);

    return (
        <div className="flex flex-col w-full space-y-8 pb-12">
            {/* Premium Header with Profile */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-primary/5 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-6 md:p-8 bg-card text-card-text backdrop-blur-3xl rounded-lg shadow-2xl border border-border flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <div className="relative">
                            <BrandIcon
                                variant="user"
                                size="hero"
                                user={displayUser}
                                className="w-20 h-20 md:w-24 md:h-24"
                            />
                        </div>

                        <div>
                            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                                <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-none text-foreground">
                                    Welcome back, {displayName || 'Teacher'}!
                                </h1>
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 text-foreground/80">
                                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                {payload.designation || (payload.role === Role.ORG_MANAGER ? 'Senior Manager' : 'Academic Faculty')} • {orgData?.name || 'Organization'}
                            </p>
                        </div>
                    </div>

                    <div className="hidden xl:flex items-center gap-8 border-l border-border pl-8">
                        <div className="text-right">
                            <p className="text-lg font-black uppercase italic tracking-tighter">
                                {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Sections"
                    value={sections.length}
                    icon={BookOpen}
                    color="primary"
                    subtitle="Currently Teaching"
                />
                <StatCard
                    title="Total Students"
                    value={totalStudents}
                    icon={Users}
                    color="indigo"
                    subtitle="Under Supervision"
                />
                <StatCard
                    title="Assessments"
                    value={assessments.length}
                    icon={FileText}
                    color="amber"
                    subtitle="Tasks Created"
                />
                <StatCard
                    title="Overall Performance"
                    value="84%"
                    icon={TrendingUp}
                    color="emerald"
                    subtitle="Avg. Success Rate"
                    isTrend={true}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* My Classes - Detailed */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-foreground">
                            <Award className="w-5 h-5 text-primary" /> Active Classes & Performance
                        </h2>
                        <Link href="/sections" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline italic">View All</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sections.length > 0 ? sections.map(section => (
                            <Link
                                key={section.id}
                                href={`/sections/${section.id}`}
                                className="group p-6 bg-card border border-border rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110 pointer-events-none">
                                    <BookOpen className="w-20 h-20" />
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{section.course?.name || 'COURSE'}</span>
                                    </div>
                                    <h3 className="text-xl font-black italic tracking-tighter uppercase mb-1 group-hover:text-primary transition-colors text-foreground">{section.name}</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">{section.studentsCount || section.students?.length || 0} Students Enrolled</p>
                                </div>

                                <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 text-muted-foreground/60">ROOM</p>
                                            <p className="text-xs font-black italic text-foreground">{section.room || 'TBD'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 text-muted-foreground/60">PERFORMANCE</p>
                                            <p className="text-xs font-black italic text-emerald-600">GOOD</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all shadow-sm">
                                        <ChevronRight className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="col-span-full py-12 text-center bg-muted/10 rounded-lg border border-dashed border-border">
                                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">No classes assigned yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Quick Actions - Premium */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2 text-foreground">
                            <PlusCircle className="w-5 h-5 text-primary" /> Core Controls
                        </h3>
                        <div className="bg-card border border-border rounded-lg p-2 shadow-xl space-y-1">
                            {payload.role === Role.ORG_MANAGER && (
                                <ActionLink href="/admin" icon={ShieldCheck} label="Admin Portal" sub="Organization settings" primary />
                            )}
                            <ActionLink href="/grades" icon={FileText} label="Manage Grades" sub="Grade entry & reports" />
                            <ActionLink href="/sections" icon={BookOpen} label="Assessments" sub="Create & manage tasks" />
                        </div>
                    </div>

                    {/* Upcoming Tasks */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2 text-foreground">
                            <Clock className="w-5 h-5 text-primary" /> Upcoming Deadlines
                        </h3>
                        <div className="space-y-3">
                            {upcomingAssessments.length > 0 ? upcomingAssessments.map(a => (
                                <Link
                                    key={a.id}
                                    href={`/sections/${a.sectionId}/assessments/${a.id}`}
                                    className="block p-4 bg-card/50 border border-primary/30 rounded-lg hover:bg-card/80 transition-all active:scale-95 group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-lg">{a.type}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground">{formatDate(a.dueDate)}</span>
                                    </div>
                                    <h4 className="text-sm font-black uppercase italic tracking-tight text-foreground group-hover:text-primary transition-colors">
                                        {a.title} {a.section && <span className="text-muted-foreground font-bold ml-1 tracking-normal not-italic">- {a.section.name}</span>}
                                    </h4>
                                    <p className="text-[10px] font-bold mt-1 uppercase tracking-widest text-muted-foreground/60">Weightage: {a.weightage}%</p>
                                </Link>
                            )) : (
                                <p className="text-xs font-bold italic text-center p-6 border border-dashed border-border rounded-lg text-muted-foreground/60">No upcoming deadlines</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: 'primary' | 'indigo' | 'amber' | 'emerald';
    subtitle: string;
    isTrend?: boolean;
}

function StatCard({ title, value, icon: Icon, color, subtitle, isTrend }: StatCardProps) {
    const colorClasses: Record<string, string> = {
        primary: "text-primary bg-primary/10 border-primary/20",
        indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    };

    return (
        <div className="p-6 bg-card border border-border rounded-lg shadow-xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClasses[color].split(' ')[0]}`}>
                <Icon className="w-16 h-16" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
                    <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                </div>

                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-foreground">{value}</h3>
                    {isTrend && <span className="text-[10px] font-black text-emerald-600 italic">+2.5%</span>}
                </div>

                <p className="text-xs font-bold mt-3 uppercase tracking-widest leading-none text-muted-foreground/60">{subtitle}</p>
            </div>
        </div>
    );
}

interface ActionLinkProps {
    href: string;
    icon: React.ElementType;
    label: string;
    sub: string;
    primary?: boolean;
}

function ActionLink({ href, icon: Icon, label, sub, primary }: ActionLinkProps) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 group ${primary
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'
                : 'hover:bg-foreground/5 active:scale-[0.98]'
                }`}
        >
            <div className={`p-2.5 rounded-lg shadow-sm ${primary ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className={`text-sm font-black uppercase italic tracking-tight leading-none ${primary ? 'text-primary-foreground' : 'text-foreground font-bold'}`}>{label}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${primary ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{sub}</p>
            </div>
            <ChevronRight className={`w-4 h-4 ml-auto transition-transform group-hover:translate-x-1 ${primary ? 'text-primary-foreground/60' : 'text-muted-foreground/40'}`} />
        </Link>
    );
}


