'use client';

import { useState } from 'react';
import {
    StudentPortalShell,
    StudentGrade
} from '@/components/student/StudentPortalShell';
import { Trophy, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function StudentGradesPage() {
    const [grades] = useState<StudentGrade[]>([
        { id: '1', course: 'Mathematics 101', assignment: 'Homework 5', score: '85/100', date: '2025-03-10' },
        { id: '2', course: 'Physics 201', assignment: 'Quiz 2', score: '92/100', date: '2025-03-08' },
        { id: '3', course: 'English Literature', assignment: 'Essay', score: '78/100', date: '2025-03-05' },
    ]);

    return (
        <StudentPortalShell activeTab="grades">
            <div className="space-y-8">
                <div className="bg-card p-6 rounded-sm shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-primary flex items-center gap-3 italic uppercase">
                        Academic Records
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right mr-4">
                            <p className="text-[10px] font-black text-card-text/40 uppercase tracking-widest">Cumulative GPA</p>
                            <p className="text-2xl font-black text-primary italic">3.8</p>
                        </div>
                        <div className="w-full md:w-64">
                            <Input icon={Search} placeholder="Filter records..." />
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-black/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-primary/5 text-[10px] font-black text-card-text/40 uppercase tracking-[0.2em] border-b border-black/5">
                                <th className="px-8 py-6">Course</th>
                                <th className="px-8 py-6">Assignment</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6">Score</th>
                                <th className="px-8 py-6 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {grades.map(grade => (
                                <tr key={grade.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="font-black text-card-text group-hover:text-primary transition-colors">{grade.course}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-card-text/80">{grade.assignment}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Graded</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xl font-black text-primary italic underline underline-offset-4">{grade.score}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <p className="text-xs font-bold text-card-text/60">{new Date(grade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <Calendar className="w-3 h-3 text-card-text/20 mt-1" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-indigo-600 rounded-sm text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4">Request Official Transcript</h3>
                        <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Need an official record for applications? Request a certified PDF or hard copy directly from the registrar.</p>
                        <button className="px-6 py-3 bg-white text-indigo-600 font-black text-xs uppercase tracking-widest rounded-sm shadow-lg hover:-translate-y-1 transition-all">Order Now</button>
                    </div>
                    <div className="p-8 bg-card border border-black/5 rounded-sm shadow-xl flex items-center gap-6">
                        <div className="p-5 bg-emerald-50 text-emerald-600 rounded-full">
                            <Trophy className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="font-black text-card-text text-lg italic uppercase tracking-tighter">Deans List Candidate</h3>
                            <p className="text-card-text/60 text-sm mt-1">Based on your current GPA of 3.8, you are eligible for the academic honors list this semester.</p>
                        </div>
                    </div>
                </div>
            </div>
        </StudentPortalShell>
    );
}
