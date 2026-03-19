'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Users, Calendar, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Assessment, Section, Role, Grade } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import GradingForm from '@/components/forms/GradingForm';

export default function AssessmentDetailPage() {
    const { token, user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();

    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [section, setSection] = useState<Section | null>(null);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    const sectionId = params.id as string;
    const assessmentId = params.assessmentId as string;
    const orgSlug = params.orgName as string;

    const fetchData = useCallback(async () => {
        if (!token || !sectionId || !assessmentId) return;
        setIsLoading(true);
        try {
            const [assessmentData, sectionData, gradesData] = await Promise.all([
                api.org.getAssessment(assessmentId, token),
                api.org.getSection(sectionId, token),
                api.org.getGrades(assessmentId, token)
            ]);

            setAssessment(assessmentData);
            setSection(sectionData);
            setGrades(gradesData);
        } catch (error) {
            console.error('Failed to fetch assessment details:', error);
            showToast('Failed to load assessment data', 'error');
            router.push(`/${orgSlug}/sections/${sectionId}`);
        } finally {
            setIsLoading(false);
        }
    }, [token, sectionId, assessmentId, showToast, router, orgSlug]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!assessment || !section) return null;

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up space-y-8">
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href={`/${orgSlug}/sections/${sectionId}`}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-card-text/40 hover:text-primary transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Section Detail
                </Link>
            </div>

            {/* Assessment Header */}
            <div className="bg-card border border-white/20 rounded-sm p-8 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none text-primary">
                    <Trophy className="w-40 h-40" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest italic rounded-sm">
                                {assessment.type}
                            </span>
                            <span className="text-[10px] font-bold text-card-text/40 uppercase tracking-widest leading-none">
                                {section.name} • {section.course?.name}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-card-text">
                            {assessment.title}
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-6 text-center md:text-right">
                        <div>
                            <p className="text-[10px] font-black text-card-text/30 uppercase tracking-widest mb-1">TOTAL MARKS</p>
                            <p className="text-3xl font-black italic text-primary">{assessment.totalMarks}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-card-text/30 uppercase tracking-widest mb-1">WEIGHTAGE</p>
                            <p className="text-3xl font-black italic text-card-text">{assessment.weightage}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-card-text/30 uppercase tracking-widest mb-1">DUE DATE</p>
                            <p className="text-lg font-black italic text-card-text/70">{assessment.dueDate ? formatDate(assessment.dueDate) : 'NO DUE DATE'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grading Table */}
            <div className="bg-card border border-white/10 rounded-sm shadow-xl overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-black uppercase italic tracking-wider">Student Performance & Grading</h2>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/2px border-b border-white/5">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-card-text/40">Student Name</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-card-text/40">Reg #</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-card-text/40">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-card-text/40 text-center">Marks</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-card-text/40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {section.students?.map((student) => {
                                const grade = grades.find(g => g.studentId === student.id);
                                return (
                                    <tr key={student.id} className="hover:bg-white/2px transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                                                    {student.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-bold text-sm text-card-text">{student.user.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-card-text/40 uppercase tabular-nums">
                                            {student.registrationNumber || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black italic uppercase tracking-widest tabular-nums">
                                            {grade ? (
                                                <span className="flex items-center gap-1.5 text-emerald-500">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Graded
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-orange-500">
                                                    <Calendar className="w-3.5 h-3.5" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {grade ? (
                                                <span className="text-lg font-black italic text-primary">{grade.marksObtained}<span className="text-xs text-card-text/30 ml-1">/ {assessment.totalMarks}</span></span>
                                            ) : (
                                                <span className="text-xs font-black text-card-text/20 italic uppercase tracking-tighter">Not Assigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedStudentId(student.id)}
                                                className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white text-[10px] font-black uppercase tracking-widest italic rounded-sm border border-primary/20 transition-all shadow-sm active:scale-95"
                                            >
                                                {grade ? 'Update Grade' : 'Assign Grade'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Grading Sidebar Overlay */}
            {selectedStudentId && (
                <div className="fixed inset-0 z-100 flex items-center justify-end bg-gray-950/60 backdrop-blur-md transition-all duration-500 p-4">
                    <div className="w-full max-w-xl h-full bg-card border-l border-white/20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] transform animate-slide-in-right p-10 overflow-y-auto rounded-sm">
                        <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                            <div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-card-text leading-tight">Student Grading</h2>
                                <p className="text-[10px] font-black text-card-text/40 uppercase tracking-widest mt-2">
                                    {section.students?.find(s => s.id === selectedStudentId)?.user.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedStudentId(null)}
                                className="p-2 text-card-text/20 hover:text-red-500 transition-colors bg-white/5 rounded-sm active:scale-90"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <GradingForm
                            assessmentId={assessmentId}
                            student={section.students?.find(s => s.id === selectedStudentId)!}
                            totalMarks={assessment.totalMarks}
                            initialData={grades.find(g => g.studentId === selectedStudentId)}
                            onSuccess={(g) => {
                                setGrades(prev => {
                                    const index = prev.findIndex(item => item.id === g.id);
                                    if (index !== -1) return prev.map(item => item.id === g.id ? g : item);
                                    return [...prev, g];
                                });
                                setSelectedStudentId(null);
                                showToast('Grade saved successfully', 'success');
                            }}
                            onCancel={() => setSelectedStudentId(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
