'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Assessment, Section, Grade, GradeStatus, UpdateGradeRequest, ApiError } from '@/types';
import { useGlobal } from '@/context/GlobalContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { BrandIcon } from '@/components/ui/Brand';

interface BulkGradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessment: Assessment;
    section: Section;
    existingGrades: Grade[];
    onSuccess: () => void;
}

export function BulkGradingModal({ isOpen, onClose, assessment, section, existingGrades, onSuccess }: BulkGradingModalProps) {
    const { token } = useAuth();
    const { dispatch } = useGlobal();

    // State to hold bulk marks and status
    const [bulkData, setBulkData] = useState<Record<string, { marksObtained: string, status: GradeStatus }>>({});
    const [globalStatus, setGlobalStatus] = useState<GradeStatus | ''>('');

    // Initialize bulk data using existing grades or defaults
    useEffect(() => {
        if (isOpen && section.students) {
            const initialData: Record<string, { marksObtained: string, status: GradeStatus }> = {};
            section.students.forEach((student) => {
                const grade = existingGrades.find(g => g.studentId === student.id);
                initialData[student.id] = {
                    marksObtained: grade ? grade.marksObtained.toString() : '',
                    status: grade ? grade.status : GradeStatus.DRAFT
                };
            });
            setBulkData(initialData);
        }
    }, [isOpen, section.students, existingGrades]);

    const handleBulkSubmit = async () => {
        if (!token) return;
        dispatch({ type: 'UI_SET_PROCESSING', payload: { isProcessing: true, id: 'bulk-grading-submit' } });
        try {
            const promises: Promise<Grade>[] = [];

            for (const [studentId, data] of Object.entries(bulkData)) {
                if (data.marksObtained.trim() !== '') {
                    const marks = Number(data.marksObtained);
                    if (marks > assessment.totalMarks) {
                        dispatch({ type: 'TOAST_ADD', payload: { message: `Marks for a student cannot exceed ${assessment.totalMarks}`, type: 'error' } });
                        dispatch({ type: 'UI_SET_PROCESSING', payload: false });
                        return; // Abort saving if validation fails
                    }
                    const payload: UpdateGradeRequest = {
                        marksObtained: marks,
                        status: data.status,
                    };
                    promises.push(api.org.updateGrade(assessment.id, studentId, payload, token));
                }
            }

            if (promises.length > 0) {
                await Promise.all(promises);
                dispatch({ type: 'TOAST_ADD', payload: { message: 'All grades updated successfully!', type: 'success' } });
                onSuccess();
            } else {
                dispatch({ type: 'TOAST_ADD', payload: { message: 'No grades to update.', type: 'info' } });
            }
            onClose();
        } catch (error: unknown) {
            console.error('Failed to update bulk grades', error);
            const apiError = error as ApiError;
            const message = apiError?.response?.data?.message || 'Failed to update grades in bulk';
            dispatch({ type: 'TOAST_ADD', payload: { message: Array.isArray(message) ? message[0] : message, type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleInputChange = (studentId: string, field: 'marksObtained' | 'status', value: string) => {
        setBulkData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleGlobalStatusChange = (newStatus: GradeStatus) => {
        setGlobalStatus(newStatus);
        setBulkData(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(studentId => {
                next[studentId].status = newStatus;
            });
            return next;
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Grade All Students"
            subtitle={`Assessment: ${assessment.title}`}
            maxWidth="max-w-4xl"
        >
            <div className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-sm border border-primary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm font-bold">
                    <div className="flex flex-col">
                        <span className="text-primary italic">Enter marks and status for each student. Blank marks will be skipped.</span>
                        <span className="text-card-text/60 mt-1">Total Marks: {assessment.totalMarks}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-card p-2 rounded-sm border border-border shadow-sm w-full md:w-auto">
                        <span className="text-xs uppercase tracking-widest text-card-text/60 whitespace-nowrap">Apply to all:</span>
                        <div className="w-40">
                            <CustomSelect<GradeStatus>
                                value={(globalStatus as GradeStatus) || GradeStatus.DRAFT}
                                onChange={handleGlobalStatusChange}
                                options={[
                                    { value: GradeStatus.DRAFT, label: 'Draft' },
                                    { value: GradeStatus.PUBLISHED, label: 'Published' },
                                    { value: GradeStatus.FINALIZED, label: 'Finalized' }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[50vh]">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-card z-10 shadow-sm">
                            <tr className="bg-muted/40 border-y border-border">
                                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-card-text/40">Student Name</th>
                                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-card-text/40">Reg #</th>
                                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-card-text/40">Marks Obtained</th>
                                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-card-text/40">Grade Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {section.students?.map((student) => (
                                <tr key={student.id} className="hover:bg-muted/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <BrandIcon variant="user" size="sm" user={student.user} className="w-8 h-8 shadow-sm" />
                                            <span className="font-bold text-sm text-card-text truncate max-w-[150px]">{student.user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-card-text/50 uppercase">{student.registrationNumber || 'N/A'}</td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            min="0"
                                            max={assessment.totalMarks}
                                            value={bulkData[student.id]?.marksObtained || ''}
                                            onChange={(e) => handleInputChange(student.id, 'marksObtained', e.target.value)}
                                            className="w-24 bg-card border border-border rounded-sm px-3 py-1.5 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder={`/${assessment.totalMarks}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3 min-w-[160px]">
                                        <CustomSelect<GradeStatus>
                                            value={bulkData[student.id]?.status || GradeStatus.DRAFT}
                                            onChange={(val) => handleInputChange(student.id, 'status', val)}
                                            options={[
                                                { value: GradeStatus.DRAFT, label: 'Draft' },
                                                { value: GradeStatus.PUBLISHED, label: 'Published' },
                                                { value: GradeStatus.FINALIZED, label: 'Finalized' }
                                            ]}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-border mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleBulkSubmit} loadingId="bulk-grading-submit" loadingText="SAVING ALL..." className="min-w-[120px]">
                        Save All Grades
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
