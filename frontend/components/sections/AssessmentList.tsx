'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Plus,
    Calendar,
    Trophy,
    Users,
    FileText,
    Trash2,
    Edit,
    Send,
    X
} from 'lucide-react';
import { api } from '@/lib/api';
import { Assessment, Section, Role, AssessmentType } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import AssessmentForm from '@/components/forms/AssessmentForm';
import SubmissionForm from '@/components/forms/SubmissionForm';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface AssessmentListProps {
    section: Section;
    role: Role;
}

export default function AssessmentList({ section, role }: AssessmentListProps) {
    const { token } = useAuth();
    const { showToast } = useToast();
    const params = useParams();
    const orgSlug = params.orgName as string;

    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
    const [deletingAssessment, setDeletingAssessment] = useState<Assessment | null>(null);
    const [submittingAssessment, setSubmittingAssessment] = useState<Assessment | null>(null);

    const fetchAssessments = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await api.org.getAssessments(token, { sectionId: section.id });
            setAssessments(data);
        } catch (error) {
            console.error('Failed to fetch assessments:', error);
            showToast('Failed to load assessments', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [token, section.id, showToast]);

    useEffect(() => {
        fetchAssessments();
    }, [fetchAssessments]);

    const handleDelete = async () => {
        if (!token || !deletingAssessment) return;
        try {
            await api.org.deleteAssessment(deletingAssessment.id, token);
            showToast('Assessment deleted successfully', 'success');
            setAssessments(prev => prev.filter(a => a.id !== deletingAssessment.id));
            setDeletingAssessment(null);
        } catch (error) {
            showToast('Failed to delete assessment', 'error');
        }
    };

    const isTeacherOrAdmin = role === Role.TEACHER || role === Role.ORG_ADMIN || role === Role.ORG_MANAGER;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card/30 p-4 rounded-sm border border-white/5 shadow-inner">
                <h3 className="text-lg font-black uppercase tracking-widest text-card-text flex items-center gap-2 italic">
                    <Trophy className="w-5 h-5 text-primary" />
                    Assessments & Grading
                </h3>
                {isTeacherOrAdmin && (
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 h-10 px-6">
                        <Plus className="w-4 h-4" />
                        Add Assessment
                    </Button>
                )}
            </div>

            {assessments.length === 0 ? (
                <div className="bg-primary/5 border border-dashed border-white/10 rounded-sm p-12 text-center">
                    <FileText className="w-12 h-12 text-card-text/20 mx-auto mb-4" />
                    <p className="text-card-text/40 font-bold italic uppercase tracking-widest text-xs">No assessments created for this section yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assessments.map(assessment => (
                        <div key={assessment.id} className="bg-card border border-white/5 rounded-sm p-6 space-y-4 hover:border-primary/40 transition-all group shadow-sm relative overflow-hidden">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/20 group-hover:bg-primary transition-colors"></div>

                            <div className="flex justify-between items-start">
                                <div className={`px-2.5 py-1 rounded-[2px] text-[10px] font-black uppercase tracking-widest italic border ${assessment.type === AssessmentType.FINAL ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20' :
                                    assessment.type === AssessmentType.MIDTERM ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' :
                                        'bg-primary/20 text-primary border-primary/20'
                                    }`}>
                                    {assessment.type}
                                </div>
                                {isTeacherOrAdmin && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingAssessment(assessment)} className="p-2 text-card-text/40 hover:text-primary transition-colors hover:bg-primary/10 rounded-sm">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeletingAssessment(assessment)} className="p-2 text-card-text/40 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-sm">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-lg font-black italic uppercase tracking-tight text-card-text leading-tight">{assessment.title}</h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-card-text/50 font-black uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <Trophy className="w-3.5 h-3.5 text-primary/60" />
                                        {assessment.totalMarks} Marks
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-primary/60" />
                                        {assessment.dueDate ? formatDate(assessment.dueDate) : 'No due date'}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="text-[10px] font-black italic uppercase tracking-widest bg-white/5 px-2 py-1 rounded-sm border border-white/5">
                                    <span className="text-card-text/30">Weightage: </span>
                                    <span className="text-primary font-black ml-1">{assessment.weightage}%</span>
                                </div>

                                {isTeacherOrAdmin && (
                                    <Link
                                        href={`/${orgSlug}/dashboard/sections/${section.id}/assessments/${assessment.id}`}
                                        className="h-8 px-4 text-[10px] uppercase font-black italic gap-1.5 flex items-center justify-center bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 transition-all rounded-sm shadow-sm"
                                    >
                                        <Users className="w-3.5 h-3.5" />
                                        Grades
                                    </Link>
                                )}

                                {role === Role.STUDENT && (
                                    <Button
                                        variant="primary"
                                        className="h-8 text-[10px] uppercase font-black italic gap-1.5"
                                        disabled={!!(assessment.dueDate && new Date(assessment.dueDate) < new Date())}
                                        onClick={() => setSubmittingAssessment(assessment)}
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        Submit
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-950/80 backdrop-blur-xl transition-all duration-300 p-4">
                    <div className="bg-card p-10 rounded-sm border border-white/10 w-full max-w-2xl transform animate-scale-in shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-4xl font-black italic tracking-tighter uppercase text-card-text leading-none">New Assessment</h2>
                                <p className="text-xs font-bold text-card-text/40 mt-2 uppercase tracking-widest">{section.name} • {section.course?.name}</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-card-text/20 hover:text-red-500 transition-colors bg-white/5 p-2 rounded-sm active:scale-95">
                                <XIcon className="w-10 h-10" />
                            </button>
                        </div>
                        <AssessmentForm
                            sectionId={section.id}
                            courseId={section.courseId!}
                            onSuccess={(a) => {
                                setAssessments(prev => [...prev, a]);
                                setIsCreateModalOpen(false);
                            }}
                            onCancel={() => setIsCreateModalOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingAssessment && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-950/80 backdrop-blur-xl transition-all duration-300 p-4">
                    <div className="bg-card p-10 rounded-sm border border-white/10 w-full max-w-2xl transform animate-scale-in shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-4xl font-black italic tracking-tighter uppercase text-card-text leading-none">Edit Assessment</h2>
                                <p className="text-xs font-bold text-card-text/40 mt-2 uppercase tracking-widest">Updating: {editingAssessment.title}</p>
                            </div>
                            <button onClick={() => setEditingAssessment(null)} className="text-card-text/20 hover:text-red-500 transition-colors bg-white/5 p-2 rounded-sm active:scale-95">
                                <XIcon className="w-10 h-10" />
                            </button>
                        </div>
                        <AssessmentForm
                            sectionId={section.id}
                            courseId={section.courseId!}
                            assessmentId={editingAssessment.id}
                            initialData={editingAssessment}
                            onSuccess={(a) => {
                                setAssessments(prev => prev.map(item => item.id === a.id ? a : item));
                                setEditingAssessment(null);
                            }}
                            onCancel={() => setEditingAssessment(null)}
                        />
                    </div>
                </div>
            )}

            {/* Submission Modal */}
            {submittingAssessment && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-950/80 backdrop-blur-xl transition-all duration-300 p-4">
                    <div className="bg-card p-10 rounded-sm border border-white/10 w-full max-w-2xl transform animate-scale-in shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-4xl font-black italic tracking-tighter uppercase text-card-text leading-none">Submit Work</h2>
                                <p className="text-xs font-bold text-card-text/40 mt-2 uppercase tracking-widest">{submittingAssessment.title}</p>
                            </div>
                            <button onClick={() => setSubmittingAssessment(null)} className="text-card-text/20 hover:text-red-500 transition-colors bg-white/5 p-2 rounded-sm active:scale-95">
                                <XIcon className="w-10 h-10" />
                            </button>
                        </div>
                        <SubmissionForm
                            assessmentId={submittingAssessment.id}
                            onSuccess={() => setSubmittingAssessment(null)}
                            onCancel={() => setSubmittingAssessment(null)}
                        />
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deletingAssessment}
                onClose={() => setDeletingAssessment(null)}
                onConfirm={handleDelete}
                title="Delete Assessment"
                description={`Are you sure you want to delete "${deletingAssessment?.title}"? This will also remove all associated grades and submissions.`}
                confirmText="Delete Assessment"
                isDestructive={true}
            />
        </div>
    );
}

// Simple XIcon for modals (using local component to avoid confusion with Lucide)
function XIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
    )
}
