'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, GraduationCap, CheckCircle2, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { Section } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SectionOverviewPage() {
    const { token } = useAuth();
    const params = useParams();
    const { showToast } = useToast();
    const [section, setSection] = useState<Section | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const sectionId = params.id as string;

    const fetchSection = useCallback(async () => {
        if (!token || !sectionId) return;
        setIsLoading(true);
        try {
            const data = await api.org.getSection(sectionId, token);
            setSection(data);
        } catch (error) {
            console.error('Failed to fetch section:', error);
            showToast('Failed to load section details', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [token, sectionId, showToast]);

    useEffect(() => {
        fetchSection();
    }, [fetchSection]);

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!section) return null;

    return (
        <div className="space-y-8 mt-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-sm text-primary">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Enrollment</p>
                        <p className="text-2xl font-black italic text-slate-900">{section.students?.length || 0} Students</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-sm text-primary">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                        <p className="text-2xl font-black italic text-emerald-500">ACTIVE</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-sm text-primary">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Schedule</p>
                        <p className="text-2xl font-black italic text-slate-900">{section.room || 'TBD'}</p>
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="text-lg font-black uppercase italic tracking-wider text-slate-900 flex items-center gap-2">
                         <GraduationCap className="w-5 h-5 text-primary" /> Enrolled Students
                    </h3>
                    <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">
                        Official Roster
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Student Name</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Reg #</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Email</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {section.students?.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                                                {student.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="font-bold text-sm text-slate-900 leading-none">{student.user.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tabular-nums tracking-tighter">
                                        {student.registrationNumber || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                        {student.user.email}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link 
                                            href={`/${params.orgName}/students/${student.user.userName}`}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline hover:text-primary-dark transition-colors"
                                        >
                                            View Profile
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!section.students || section.students.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-black uppercase tracking-widest text-xs">
                                        No students enrolled in this section.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
