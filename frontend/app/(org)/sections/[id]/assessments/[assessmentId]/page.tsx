'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Users, Calendar, CheckCircle2, Link as LinkIcon, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { Assessment, Section, Grade, Submission, Role } from '@/types';
import { useGlobal } from '@/context/GlobalContext';
import { useParams, useRouter } from 'next/navigation';
import { formatDate, getPublicUrl } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import GradingForm from '@/components/forms/GradingForm';
import { BulkGradingModal } from '@/components/forms/BulkGradingModal';
import { BrandIcon } from '@/components/ui/Brand';
import { Loading } from '@/components/ui/Loading';

export default function AssessmentDetailPage() {
    const { token, user } = useAuth();
    const role = user?.role;
    const userId = user?.id;
    const params = useParams();
    const router = useRouter();
    const { state, dispatch } = useGlobal();

    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [section, setSection] = useState<Section | null>(null);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const isLoading = state.ui.isLoading;
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [showBulkGrading, setShowBulkGrading] = useState(false);

    const isAssigned = section?.teachers?.some(t => t.user?.id === userId);
    const canGrade = (role === Role.TEACHER || role === Role.ORG_MANAGER) && isAssigned;
    const isTeacherOrAdmin = role === Role.TEACHER || role === Role.ORG_ADMIN || role === Role.ORG_MANAGER;

    const sectionId = params.id as string;
    const assessmentId = params.assessmentId as string;

    const fetchData = useCallback(async () => {
        if (!token || !sectionId || !assessmentId) return;
        dispatch({ type: 'UI_SET_LOADING', payload: true });
        try {
            const [assessmentData, sectionData, gradesData, submissionsData] = await Promise.all([
                api.org.getAssessment(assessmentId, token),
                api.org.getSection(sectionId, token),
                api.org.getGrades(assessmentId, token),
                api.org.getSubmissions(assessmentId, token)
            ]);

            setAssessment(assessmentData);
            setSection(sectionData);
            setGrades(gradesData);
            setSubmissions(submissionsData);
        } catch (error: unknown) {
            console.error('Failed to fetch assessment details:', error);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load assessment data', type: 'error' } });
            router.push(`/sections/${sectionId}`);
        } finally {
            dispatch({ type: 'UI_SET_LOADING', payload: false });
        }
    }, [token, sectionId, assessmentId, dispatch, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <Loading size="lg" />
            </div>
        );
    }

    if (!assessment || !section) return null;

    return (
        <div className="flex flex-col w-full space-y-8">
            {/* Assessment Header */}
            <div className="bg-card border border-border rounded-lg p-8 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none text-primary">
                    <Trophy className="w-40 h-40" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-widest rounded-lg">
                                {assessment.type}
                            </span>
                            <span className="text-[10px] font-bold text-card-text/40 tracking-widest leading-none">
                                {section.name} • {section.course?.name}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-card-text">
                            {assessment.title}
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-6 text-center md:text-right">
                        <div>
                            <p className="text-[10px] font-black text-card-text/30 tracking-widest mb-1">Total Marks</p>
                            <p className="text-3xl font-black text-primary">{assessment.totalMarks}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-card-text/30 tracking-widest mb-1">Weightage</p>
                            <p className="text-3xl font-black text-card-text">{assessment.weightage}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-card-text/30 tracking-widest mb-1">Due Date</p>
                            <p className="text-lg font-black text-card-text/70">{assessment.dueDate ? formatDate(assessment.dueDate) : 'No Due Date'}</p>
                        </div>
                    </div>
                </div>

                {/* Resources Section */}
                {(assessment.externalLink || (assessment.files && assessment.files.length > 0)) && (
                    <div className="relative z-10 mt-8 pt-6 border-t border-border flex flex-wrap gap-4">
                        {assessment.externalLink && (
                            <a
                                href={assessment.externalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-card/40 hover:bg-card border border-border rounded-lg text-xs font-bold transition-colors text-blue-400 hover:text-blue-300 shadow-sm"
                            >
                                <LinkIcon className="w-4 h-4" />
                                External Resource
                            </a>
                        )}
                        {assessment.files?.map(file => (
                            <a
                                key={file.id}
                                href={getPublicUrl(file.path)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-xs font-bold transition-colors text-primary shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                <div className="flex flex-col text-left leading-none">
                                    <span className="truncate max-w-50">{file.filename || 'Download File'}</span>
                                    {file.size && <span className="text-[9px] opacity-70 mt-1 tracking-widest leading-none">{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Grading Table (Teachers & Admins) */}
            {isTeacherOrAdmin && (
                <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-border bg-primary/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-black text-foreground tracking-wider">Student Performance & Grading</h2>
                        </div>
                        {canGrade && (
                            <button
                                onClick={() => setShowBulkGrading(true)}
                                className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground text-[10px] font-black tracking-widest rounded-lg transition-colors shadow-sm active:scale-95"
                            >
                                Grade All
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/20 border-b border-border">
                                    <th className="px-6 py-4 text-[11px] font-black tracking-widest text-card-text/40">Student Name</th>
                                    <th className="px-6 py-4 text-[11px] font-black tracking-widest text-card-text/40">Reg #</th>
                                    <th className="px-6 py-4 text-[11px] font-black tracking-widest text-card-text/40">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black tracking-widest text-card-text/40">Submission</th>
                                    <th className="px-6 py-4 text-[11px] font-black tracking-widest text-card-text/40 text-center">Marks</th>
                                    <th className="px-6 py-4 text-[11px] font-black tracking-widest text-card-text/40 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {section.students?.map((student) => {
                                    const grade = grades.find(g => g.studentId === student.id);
                                    const submission = submissions.find(s => s.studentId === student.id);
                                    return (
                                        <tr
                                            key={student.id}
                                            className={`hover:bg-muted/40 transition-colors group ${submission?.fileUrl ? 'cursor-pointer' : ''}`}
                                            onClick={() => {
                                                if (submission?.fileUrl) {
                                                    window.open(submission.fileUrl, '_blank', 'noopener,noreferrer');
                                                }
                                            }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <BrandIcon
                                                        variant="user"
                                                        size="sm"
                                                        user={student.user}
                                                        className="w-8 h-8 shadow-sm"
                                                    />
                                                    <div className="font-bold text-sm text-card-text">{student.user.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-card-text/40 tabular-nums">
                                                {student.registrationNumber || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-black italic tracking-widest tabular-nums">
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
                                            <td className="px-6 py-4 text-xs font-bold text-card-text/40">
                                                {submission ? (
                                                    (submission.files && submission.files.length > 0) ? (
                                                        <a
                                                            href={getPublicUrl(submission.files[0].path)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:text-primary-light flex items-center gap-1.5 underline-offset-2 hover:underline font-black italic tracking-widest"
                                                        >
                                                            <LinkIcon className="w-3 h-3" /> View Work
                                                        </a>
                                                    ) : submission.fileUrl ? (
                                                        <a
                                                            href={submission.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:text-primary-light flex items-center gap-1.5 underline-offset-2 hover:underline font-black italic tracking-widest"
                                                        >
                                                            <LinkIcon className="w-3 h-3" /> View Link
                                                        </a>
                                                    ) : (
                                                        <span className="text-emerald-500 italic flex items-center gap-1.5 font-black tracking-widest"><CheckCircle2 className="w-3 h-3" /> Done</span>
                                                    )
                                                ) : (
                                                    <span className="text-muted-foreground italic font-black tracking-widest">No Submission</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {grade ? (
                                                    <span className="text-lg font-black italic text-primary">{grade.marksObtained}<span className="text-xs text-card-text/30 ml-1">/ {assessment.totalMarks}</span></span>
                                                ) : (
                                                    <span className="text-xs font-black text-muted-foreground italic tracking-tighter">Not Assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {canGrade && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedStudentId(student.id);
                                                        }}
                                                        className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[10px] font-black tracking-widest rounded-lg border border-primary/20 transition-all shadow-sm active:scale-95 z-10 relative"
                                                    >
                                                        {grade ? 'Update Grade' : 'Assign Grade'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bulk Grading Modal */}
            {showBulkGrading && canGrade && (
                <BulkGradingModal
                    isOpen={showBulkGrading}
                    onClose={() => setShowBulkGrading(false)}
                    assessment={assessment}
                    section={section}
                    existingGrades={grades}
                    onSuccess={fetchData}
                />
            )}

            {/* Grading Modal */}
            <Modal
                isOpen={!!selectedStudentId}
                onClose={() => setSelectedStudentId(null)}
                title="Student Grading"
                subtitle={selectedStudentId ? section.students?.find(s => s.id === selectedStudentId)?.user.name : ''}
                maxWidth="max-w-xl"
            >
                {selectedStudentId && (() => {
                    const student = section.students?.find(s => s.id === selectedStudentId);
                    if (!student) return null;
                    return (
                        <GradingForm
                            assessmentId={assessmentId}
                            student={student}
                            totalMarks={assessment.totalMarks}
                            initialData={grades.find(g => g.studentId === selectedStudentId)}
                            onSuccess={(g) => {
                                setGrades(prev => {
                                    const index = prev.findIndex(item => item.id === g.id);
                                    if (index !== -1) return prev.map(item => item.id === g.id ? g : item);
                                    return [...prev, g];
                                });
                                setSelectedStudentId(null);
                                dispatch({ type: 'TOAST_ADD', payload: { message: 'Grade saved successfully', type: 'success' } });
                            }}
                            onCancel={() => setSelectedStudentId(null)}
                        />
                    );
                })()}
            </Modal>
        </div>
    );
}
