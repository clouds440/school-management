'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Calendar, Type, FileText, Percent } from 'lucide-react';
import { api } from '@/lib/api';
import { Assessment, AssessmentType, CreateAssessmentRequest, UpdateAssessmentRequest, ApiError } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assessmentSchema, AssessmentFormData } from '@/lib/schemas';

interface AssessmentFormProps {
    sectionId: string;
    courseId: string;
    assessmentId?: string;
    initialData?: Assessment;
    onSuccess?: (assessment: Assessment) => void;
    onCancel?: () => void;
}

export default function AssessmentForm({ 
    sectionId, 
    courseId, 
    assessmentId, 
    initialData,
    onSuccess,
    onCancel 
}: AssessmentFormProps) {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<AssessmentFormData>({
        resolver: zodResolver(assessmentSchema),
        defaultValues: initialData ? {
            title: initialData.title,
            type: initialData.type,
            totalMarks: initialData.totalMarks.toString(),
            weightage: initialData.weightage.toString(),
            dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        } : {
            title: '',
            type: AssessmentType.ASSIGNMENT,
            totalMarks: '100',
            weightage: '10',
            dueDate: '',
        }
    });

    const formData = watch();

    const onSubmit: SubmitHandler<AssessmentFormData> = async (data) => {
        setIsSaving(true);
        try {
            const payload: CreateAssessmentRequest = {
                ...data,
                sectionId,
                courseId,
                totalMarks: Number(data.totalMarks),
                weightage: Number(data.weightage),
                dueDate: data.dueDate || undefined,
            };

            let savedAssessment: Assessment;
            if (assessmentId) {
                savedAssessment = await api.org.updateAssessment(assessmentId, payload as UpdateAssessmentRequest, token!);
            } else {
                savedAssessment = await api.org.createAssessment(payload, token!);
            }

            showToast(`Assessment ${assessmentId ? 'updated' : 'created'} successfully.`, 'success');
            onSuccess?.(savedAssessment);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const message = apiError?.response?.data?.message || 'Failed to save assessment';
            showToast(Array.isArray(message) ? message[0] : message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Assessment Title</Label>
                    <Input
                        id="title"
                        type="text"
                        {...register('title')}
                        error={!!errors.title}
                        icon={FileText}
                        placeholder="e.g. Midterm Exam, Assignment 1"
                    />
                    {errors.title && <p className="text-xs text-red-500 font-bold">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Assessment Type</Label>
                        <CustomSelect
                            options={[
                                { value: AssessmentType.ASSIGNMENT, label: 'Assignment' },
                                { value: AssessmentType.QUIZ, label: 'Quiz' },
                                { value: AssessmentType.MIDTERM, label: 'Midterm' },
                                { value: AssessmentType.FINAL, label: 'Final Exam' },
                                { value: AssessmentType.PROJECT, label: 'Project' },
                            ]}
                            value={formData.type}
                            onChange={(val) => setValue('type', val as AssessmentType)}
                            error={!!errors.type}
                            icon={Type}
                        />
                        {errors.type && <p className="text-xs text-red-500 font-bold">{errors.type.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            {...register('dueDate')}
                            error={!!errors.dueDate}
                            icon={Calendar}
                        />
                        {errors.dueDate && <p className="text-xs text-red-500 font-bold">{errors.dueDate.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="totalMarks">Total Marks</Label>
                        <Input
                            id="totalMarks"
                            type="number"
                            {...register('totalMarks')}
                            error={!!errors.totalMarks}
                            icon={BookOpen}
                            placeholder="100"
                        />
                        {errors.totalMarks && <p className="text-xs text-red-500 font-bold">{errors.totalMarks.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="weightage">Weightage (%)</Label>
                        <Input
                            id="weightage"
                            type="number"
                            {...register('weightage')}
                            error={!!errors.weightage}
                            icon={Percent}
                            placeholder="10"
                        />
                        {errors.weightage && <p className="text-xs text-red-500 font-bold">{errors.weightage.message}</p>}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving...</span>
                        </div>
                    ) : (
                        assessmentId ? 'Update Assessment' : 'Create Assessment'
                    )}
                </Button>
            </div>
        </form>
    );
}
