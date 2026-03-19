'use client';

import { BookOpen, Clock, CheckCircle, User, Book } from 'lucide-react';
import Link from 'next/link';
import { Section, FinalGrade, Announcement } from '@/types';

interface OverviewTabProps {
    sections: Section[];
    finalGrades: FinalGrade[];
    announcements: Announcement[];
    orgSlug: string;
    userName: string;
    onTabChange: (id: string) => void;
}

export default function OverviewTab({ sections, finalGrades, announcements, orgSlug, userName, onTabChange }: OverviewTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left mt-8 animate-fade-in-up">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
                {/* Course Progress Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Current Coursework
                        </h2>
                        <button onClick={() => onTabChange('courses')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                            View Detailed Schedule →
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sections.map(sec => (
                            <div key={sec.id} className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm hover:shadow-md transition-shadow group border-l-4 border-l-primary text-left">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{sec.course?.name}</p>
                                        <h3 className="text-base font-black italic uppercase tracking-tighter text-slate-900 leading-tight group-hover:text-primary transition-colors">{sec.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{sec.room || 'TBD'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Completion</span>
                                        <span className="text-slate-900">75%</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '75%' }}></div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                                                <User className="w-3 h-3 text-primary" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-tight">{sec.teachers?.[0]?.user?.name || 'Assigned Staff'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sections.length === 0 && (
                            <div className="col-span-2 p-12 bg-slate-50 border border-dashed border-slate-200 rounded-sm text-center">
                                <Book className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">No active courses found</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent Performance */}
                <section className="space-y-4">
                    <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        Academic Performance
                    </h2>
                    <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {finalGrades.slice(0, 5).map(grade => (
                                <div key={grade.sectionId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-primary/5 rounded-sm flex items-center justify-center border border-primary/10 shadow-inner">
                                            <span className="text-sm font-black italic text-primary">{grade.letterGrade || 'A'}</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-1">{grade.sectionName}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{grade.courseName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black italic text-slate-900 leading-none">{grade.finalPercentage}%</p>
                                        <div className="w-20 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${(Number(grade.finalPercentage) || 0) > 80 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                style={{ width: `${grade.finalPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {finalGrades.length === 0 && (
                                <div className="p-10 text-center">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">No grade reports available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* Sidebar Area */}
            <div className="space-y-8">
                {/* Schedule Preview */}
                <div className="bg-slate-900 rounded-sm p-8 shadow-xl text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Next Sessions</h3>
                            <Clock className="w-4 h-4 text-primary" />
                        </div>

                        <div className="space-y-6">
                            {sections.slice(0, 2).map((sec, idx) => (
                                <div key={sec.id} className="relative pl-6 border-l-2 border-primary text-left">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 italic">
                                        {idx === 0 ? 'Upcoming Today' : 'Scheduled Tomorrow'}
                                    </p>
                                    <p className="text-sm font-black uppercase italic tracking-tighter text-white leading-tight">{sec.name}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{sec.room || 'Main Hall B'}</p>
                                </div>
                            ))}
                            {sections.length === 0 && (
                                <p className="text-[10px] text-slate-500 italic font-black uppercase tracking-widest">Clear Schedule</p>
                            )}
                        </div>

                        <button
                            onClick={() => onTabChange('courses')}
                            className="block w-full mt-10 py-3.5 bg-white text-slate-900 text-center text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-primary hover:text-white transition-all italic"
                        >
                            Open Calendar
                        </button>
                    </div>
                </div>

                {/* Announcements */}
                <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-8 border-b border-slate-100 pb-4">Campus Notices</h3>
                    <div className="space-y-8">
                        {announcements.map(ann => (
                            <div key={ann.id} className="group text-left cursor-pointer">
                                <h4 className="text-sm font-black italic uppercase tracking-tighter text-slate-800 group-hover:text-primary transition-colors leading-tight">
                                    {ann.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 font-medium">
                                    {ann.content}
                                </p>
                                <div className="flex items-center justify-between mt-4 text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-400 transition-colors">
                                    <span>{ann.author}</span>
                                    <span>{new Date(ann.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
