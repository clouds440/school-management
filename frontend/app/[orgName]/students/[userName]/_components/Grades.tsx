'use client';

import { useState } from 'react';
import { Trophy, Calendar, Search, Award, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { FinalGradeResponse } from '@/types';

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
        <div className="max-w-7xl mx-auto space-y-8 pb-10 px-4 sm:px-6">
            
            {/* Header Section with Achievement Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Academic Achievement</h1>
                    <p className="text-slate-500 mt-1">A definitive record of your semester progress and results.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Semester Average</p>
                            <p className="text-xl font-bold text-slate-900">{averageGrade}%</p>
                        </div>
                    </div>
                    <div className="w-full md:w-64">
                        <Input
                            icon={Search}
                            placeholder="Filter results..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white border-slate-200 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGrades.map(grade => (
                    <div key={grade.sectionId} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full border-t-4 border-t-indigo-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{grade.courseName}</p>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{grade.sectionName}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center font-bold text-slate-700 shadow-sm">
                                {grade.letterGrade || 'A'}
                            </div>
                        </div>

                        <div className="space-y-6 mt-auto">
                            <div className="flex items-end justify-between">
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Final Score</p>
                                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{grade.finalPercentage}%</p>
                                </div>
                                <Award className="w-8 h-8 text-amber-500/20 group-hover:text-amber-500 transition-colors" />
                            </div>

                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${grade.finalPercentage}%` }}
                                ></div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <Calendar className="w-3 h-3" />
                                    Record Verified
                                </div>
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg font-bold uppercase">Official</span>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredGrades.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No grade records found</p>
                    </div>
                )}
            </div>

            {/* Performance Context Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10 text-left">
                        <h3 className="text-xl font-bold tracking-tight mb-3">Academic Certification</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">Your semester results are complete. You can now download an official digital transcript for your records or applications.</p>
                        <button className="px-6 py-3 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-lg hover:bg-slate-50 transition-colors">
                            Download Transcript (PDF)
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-slate-900 text-lg">Dean's List Status</h3>
                        <p className="text-slate-500 text-sm mt-1 leading-relaxed">With a weighted average of {averageGrade}%, you are currently eligible for semester honors.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
