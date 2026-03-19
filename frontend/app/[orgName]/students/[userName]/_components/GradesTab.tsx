'use client';

import { useEffect, useState } from 'react';
import { Trophy, Calendar, Search, Award, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { FinalGradeResponse } from '@/types';

interface GradesTabProps {
    token: string;
}

export default function GradesTab({ token }: GradesTabProps) {
    const [finalGrades, setFinalGrades] = useState<FinalGradeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        api.org.getOwnFinalGrades(token)
            .then(data => setFinalGrades(data || []))
            .finally(() => setLoading(false));
    }, [token]);

    const filteredGrades = finalGrades.filter(grade =>
        grade.courseName.toLowerCase().includes(search.toLowerCase()) ||
        grade.sectionName.toLowerCase().includes(search.toLowerCase())
    );

    const averageGrade = finalGrades.length > 0
        ? (finalGrades.reduce((acc, g) => acc + g.finalPercentage, 0) / finalGrades.length).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-8 mt-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Achievement Ledger</h2>
                    <p className="text-slate-500 mt-1 font-bold text-[10px] uppercase tracking-widest leading-none">Official academic performance for Spring 2026</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm flex items-center gap-4 min-w-[180px]">
                        <div className="p-3 bg-primary/10 rounded-sm text-primary shadow-inner">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Semester Average</p>
                            <p className="text-xl font-black italic text-slate-900 leading-none">{averageGrade}%</p>
                        </div>
                    </div>
                    <div className="w-full md:w-64">
                        <Input
                            icon={Search}
                            placeholder="Filter transcripts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white border-slate-200 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGrades.map(grade => (
                        <div key={grade.sectionId} className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full border-l-4 border-l-primary relative overflow-hidden text-left">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Award className="w-16 h-16 text-slate-900" />
                            </div>

                            <div className="flex justify-between items-start mb-10 text-left relative z-10">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{grade.courseName}</p>
                                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900 leading-tight group-hover:text-primary transition-colors">{grade.sectionName}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-sm border border-slate-200 bg-slate-50 flex items-center justify-center font-black text-primary shadow-inner italic">
                                    {grade.letterGrade || 'A'}
                                </div>
                            </div>

                            <div className="space-y-6 mt-auto relative z-10 text-left">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Weighted Score</p>
                                        <p className="text-3xl font-black italic text-slate-900 tracking-tight">{grade.finalPercentage}%</p>
                                    </div>
                                </div>

                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                        style={{ width: `${grade.finalPercentage}%` }}
                                    ></div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                        <Calendar className="w-3 h-3 text-primary" />
                                        Verified System Record
                                    </div>
                                    <span className="text-[8px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-sm font-black uppercase tracking-widest border border-emerald-100">Verified</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredGrades.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-slate-50 rounded-sm border-2 border-dashed border-slate-200">
                            <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">No filtered results found</p>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="p-10 bg-slate-900 rounded-sm text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">Transcript Management</h3>
                        <p className="text-slate-400 text-xs mb-8 leading-relaxed font-bold uppercase tracking-widest italic">Secure export of verified semester results as PDF.</p>
                        <button className="px-8 py-4 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-sm shadow-lg hover:bg-primary hover:text-white transition-all italic">
                            Generate Document (PDF)
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-sm flex items-center gap-8 relative group overflow-hidden">
                    <div className="w-20 h-20 bg-primary/5 text-primary rounded-sm flex items-center justify-center border border-primary/10 shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                        <Trophy className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="font-black italic uppercase tracking-tighter text-slate-900 text-xl leading-none mb-2">Honors List</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic leading-relaxed">
                            Candidate for semester honors with {averageGrade}% weighted average.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
