'use client';

import { useState } from 'react';
import { Trophy, Calendar, Award, TrendingUp } from 'lucide-react';
import { FinalGradeResponse } from '@/types';
import { Card } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';

export default function Grades({ grades }: { grades: FinalGradeResponse[] }) {
    const [search, setSearch] = useState('');

    const filteredGrades = grades.filter(grade =>
        grade.courseName.toLowerCase().includes(search.toLowerCase()) ||
        grade.sectionName.toLowerCase().includes(search.toLowerCase())
    );

    const averageGrade = grades.length > 0
        ? (grades.reduce((acc, g) => acc + (Number(g.finalPercentage) || 0), 0) / grades.length).toFixed(1)
        : '0.0';

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4 sm:px-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
                        Academic Transcript
                    </h1>
                    <p className="text-slate-500 mt-3 font-bold max-w-md tracking-tight">Your verified semester performance and official grade audit.</p>
                </div>

                <div className="w-full md:w-80">
                    <SearchBar
                        placeholder="Search records..."
                        value={search}
                        onChange={setSearch}
                    />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Achievement Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card padding="lg" accentColor="bg-indigo-600" className="bg-slate-900 border-0 shadow-2xl relative overflow-hidden group" delay={0}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10 text-left">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Cumulative Average</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white italic leading-none">{averageGrade}</span>
                                <span className="text-xl font-black text-indigo-400 italic">%</span>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-sans not-italic">Institutional Rank</p>
                                <p className="text-sm font-black text-slate-100 italic flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    Dean&apos;s Distinction List
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card padding="md" className="border-slate-100 bg-emerald-50/30" delay={100}>
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200">
                                <Award className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 italic uppercase">Honor Roll</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Verified Status</p>
                            </div>
                        </div>
                    </Card>

                    <button className="w-full py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm active:scale-95 group flex items-center justify-center gap-2">
                        Download Report
                        <span className="text-slate-300 group-hover:text-indigo-500 transition-colors">↓</span>
                    </button>
                </div>

                {/* Grade List Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredGrades.map((grade, index) => (
                            <Card
                                key={grade.sectionId}
                                accentColor="bg-primary"
                                padding="md"
                                className="group hover:border-indigo-200 transition-all duration-300 h-auto"
                                delay={200 + (index * 50)}
                            >
                                <div className="flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 flex-1 text-left">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-900 italic text-xl shadow-xs group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                                            {grade.letterGrade || 'A'}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{grade.courseName}</p>
                                            <h3 className="text-lg font-black text-slate-900 italic tracking-tight leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{grade.sectionName}</h3>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-baseline gap-1 justify-end">
                                            <span className="text-2xl font-black text-slate-900 italic leading-none">{grade.finalPercentage}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase italic">%</span>
                                        </div>
                                        <div className="w-16 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden ml-auto">
                                            <div className="h-full bg-indigo-500" style={{ width: `${grade.finalPercentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {filteredGrades.length === 0 && (
                        <div className="p-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                            <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No matching records found</p>
                        </div>
                    )}

                    {/* Footer Info Card */}
                    <Card padding="lg" className="bg-indigo-50/30 border-indigo-100/50" delay={400}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm text-indigo-500">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div className="max-w-md">
                                    <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Performance Summary</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 italic">
                                        Your academic trajectory is currently <span className="text-indigo-600 font-bold uppercase tracking-widest">Positive</span>. Maintain consistent presence in all sections to secure final honors.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Calendar className="w-4 h-4 text-indigo-400" />
                                Authentic Transcript v2.0
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
