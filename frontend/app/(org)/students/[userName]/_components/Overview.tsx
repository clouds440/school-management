import { useParams, useRouter } from 'next/navigation';
import {
    BookOpen, Clock, Trophy, User, Book, CheckCircle, Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Section, FinalGradeResponse, Assessment } from '@/types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

export interface StudentAnnouncement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: string;
}

export default function Overview({ sections, grades, assessments = [] }: { sections: Section[], grades: FinalGradeResponse[], assessments?: Assessment[] }) {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();

    if (!user) return null;

    // Calculate Stats
    const totalCourses = sections.length;
    const averageGrade = grades.length > 0
        ? (grades.reduce((sum, g) => sum + (Number(g.finalPercentage) || 0), 0) / grades.length).toFixed(1)
        : 'N/A';

    // For demo purposes, we'll use 94% attendance as a static value if not in backend yet
    const attendanceRate = '94%';

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-16 px-4 sm:px-6">

            {/* Header Section with Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter leading-none italic uppercase">
                        Hello, {user.name?.split(' ')[0] || 'Student'}
                    </h1>
                    <p className="text-muted-foreground mt-3 font-bold max-w-md tracking-tight">Your academic performance at a glance. Stay ahead of your deadlines and track your progress.</p>
                </div>

                <div className="hidden md:flex items-center gap-5 bg-card/40 backdrop-blur-md px-8 py-5 rounded-2xl border border-border shadow-xl shadow-black/5">
                    <div className="p-3.5 bg-primary/10 rounded-xl border border-primary/20">
                        <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Current Session</span>
                        <span className="text-lg font-black text-foreground italic">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card padding="md" accentColor="bg-indigo-500" className="border-l-4 border-l-indigo-500 border-t-0 ring-0 h-auto" delay={0}>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">Enrolled Units</p>
                    <p className="text-3xl font-black text-foreground italic leading-none">{totalCourses} <span className="text-xs font-bold text-muted-foreground/60 not-italic ml-1">COURSES</span></p>
                </Card>
                <Card padding="md" accentColor="bg-primary" className="border-l-4 border-l-primary border-t-0 ring-0 h-auto" delay={100}>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">Academic Standing</p>
                    <p className="text-3xl font-black text-primary italic leading-none">{averageGrade}% <span className="text-xs font-bold text-muted-foreground/60 not-italic ml-1 uppercase">GPA EQUIV</span></p>
                </Card>
                <Card padding="md" accentColor="bg-emerald-500" className="border-l-4 border-l-emerald-500 border-t-0 ring-0 h-auto" delay={200}>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">Engagement</p>
                    <p className="text-3xl font-black text-emerald-600 italic leading-none">{attendanceRate} <span className="text-xs font-bold text-muted-foreground/60 not-italic ml-1 uppercase">PRESENCE</span></p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Course Progress Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-3 uppercase italic tracking-tight">
                                <BookOpen className="w-6 h-6 text-indigo-500" />
                                Live Coursework
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sections.map((sec, index) => (
                                <Card key={sec.id} accentColor="bg-indigo-500" padding="lg" delay={300 + (index * 100)}>
                                    <CardHeader className="mb-4">
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">{sec.course?.name}</p>
                                            <h3 className="text-lg font-black text-foreground leading-tight group-hover:text-indigo-600 transition-colors italic">{sec.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg border border-border shadow-xs">
                                            <Clock className="w-4 h-4 text-primary/60" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{sec.room || 'TBD'}</span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[10px] font-black">
                                                <span className="text-muted-foreground uppercase tracking-widest">Progress</span>
                                                <span className="text-foreground bg-muted px-2 py-0.5 rounded">75%</span>
                                            </div>
                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden shadow-inner border border-border">
                                                <div className="h-full bg-indigo-500 rounded-full shadow-lg" style={{ width: '75%' }}></div>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="mt-6 pt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-muted/30 flex items-center justify-center border border-border shadow-xs">
                                                <User className="w-4 h-4 text-muted-foreground/60" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{sec.teachers?.[0]?.user?.name || 'Assigned Staff'}</span>
                                        </div>
                                        <Link
                                            href={`/students/${user.userName}?tab=courses`}
                                            className="p-2.5 bg-slate-900 text-white hover:bg-indigo-600 rounded-xl transition-all shadow-lg active:scale-90"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                            {sections.length === 0 && (
                                <div className="col-span-2 p-16 bg-muted/30 border-2 border-dashed border-border rounded-3xl text-center">
                                    <Book className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-xs text-muted-foreground/40 font-black uppercase tracking-[0.2em]">No active enrollments</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Recent Performance */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-black text-foreground flex items-center gap-3 uppercase italic tracking-tight">
                            <Trophy className="w-6 h-6 text-amber-500" />
                            Academic Merits
                        </h2>
                        <Card padding="none" className="overflow-hidden border-border" delay={400}>
                            <div className="divide-y divide-border">
                                {grades.slice(0, 5).map(grade => (
                                    <div key={grade.sectionId} className="p-5 flex items-center justify-between hover:bg-muted/10 transition-all duration-300 group/item">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-muted/30 rounded-2xl flex items-center justify-center border border-border shadow-sm group-hover/item:bg-card group-hover/item:border-primary/20 transition-all">
                                                <span className="text-lg font-black text-foreground italic">{grade.letterGrade || 'A'}</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-base font-black text-foreground leading-tight italic">{grade.sectionName}</p>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mt-1">{grade.courseName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-foreground italic">{grade.finalPercentage}%</p>
                                            <div className="w-24 h-1.5 bg-muted rounded-full mt-2 overflow-hidden shadow-inner border border-border">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${(Number(grade.finalPercentage) || 0) > 80 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                    style={{ width: `${grade.finalPercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {grades.length === 0 && (
                                    <div className="p-16 text-center bg-muted/10">
                                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">No published results found</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </section>
                </div>

                {/* Sidebar Area */}
                <div className="space-y-10 self-start">
                    {/* Action Required Section */}
                    <section className="space-y-6">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2 italic">
                            <CheckCircle className="w-5 h-5 text-primary" />
                            Action Items
                        </h3>
                        <div className="space-y-4">
                            {assessments.slice(0, 5).map((ann, index) => {
                                const isDone = (ann?._count?.submissions || 0) > 0;
                                return (
                                    <Card
                                        key={ann.id}
                                        onClick={() => router.push(`/students/${user.userName}?tab=assessments&assessmentId=${ann.id}`)}
                                        padding="md"
                                        accentColor={isDone ? 'bg-emerald-500' : 'bg-primary'}
                                        className="border-border hover:shadow-xl"
                                        delay={500 + (index * 50)}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border shadow-xs ${isDone ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                                                {isDone ? 'Done' : 'Pending'}
                                            </span>
                                            <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{ann.section?.name || 'Class'}</span>
                                        </div>
                                        <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors leading-tight italic mb-3">
                                            {ann.title}
                                        </h4>
                                        <div className="flex items-center justify-between mt-4 text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                            <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 bg-muted rounded border border-border">{ann.type}</span>
                                            </div>
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 opacity-50" /> {ann.dueDate ? new Date(ann.dueDate).toLocaleDateString() : 'TBD'}</span>
                                        </div>
                                    </Card>
                                )
                            })}
                            {assessments.length === 0 && (
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic text-center py-6 bg-muted/10 rounded-2xl border-2 border-dashed border-border">No active tasks</p>
                            )}
                        </div>
                    </section>

                    {/* Weekly Schedule Sneak Peek */}
                    <Card accentColor="bg-indigo-400" className="bg-slate-950 border-0 shadow-2xl p-6" padding="none" delay={700}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground/40">Next Activity</h3>
                            <div className="p-1.5 bg-foreground/5 rounded-lg border border-foreground/10">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {sections.slice(0, 2).map((sec, idx) => (
                                <div key={sec.id} className="relative pl-4 border-l-2 border-indigo-500/30 text-left group/sched">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                                        {idx === 0 ? 'Upcoming • 10:00 AM' : 'Tomorrow • 09:30 AM'}
                                    </p>
                                    <p className="text-sm font-black text-white leading-tight italic group-hover/sched:text-indigo-400 transition-colors uppercase tracking-tight">{sec.name}</p>
                                    <p className="text-[9px] text-muted-foreground/60 mt-1.5 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <MapPinHouse className="w-3 h-3 opacity-40" />
                                        {sec.room || 'Main Hall B'}
                                    </p>
                                </div>
                            ))}
                            {sections.length === 0 && (
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic py-2">No scheduled events</p>
                            )}
                        </div>

                        <Link
                            href={`/students/${user.userName}?tab=courses`}
                            className="block w-full mt-6 py-3 bg-white/5 hover:bg-white text-muted-foreground/40 hover:text-slate-900 text-center text-[9px] font-black uppercase tracking-[0.25em] rounded-xl border border-white/5 hover:border-white transition-all shadow-lg active:scale-95"
                        >
                            View Schedule
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Helper icons missing from imports
function MapPinHouse({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
    );
}
