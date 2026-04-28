'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Calendar, Type, FileText, Percent, UploadCloud, Link as LinkIcon, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useGlobal } from '@/context/GlobalContext';
import { Assessment, AssessmentType, CreateAssessmentRequest, UpdateAssessmentRequest } from '@/types';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assessmentSchema, AssessmentFormData } from '@/lib/schemas';
import { Toggle } from '@/components/ui/Toggle';

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
    const { state, dispatch } = useGlobal();
    const isProcessing = state.ui.processing['assessment-submit'];

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
            allowSubmissions: initialData.allowSubmissions ?? true,
            externalLink: initialData.externalLink || '',
            isVideoLink: initialData.isVideoLink || false,
        } : {
            title: '',
            type: AssessmentType.ASSIGNMENT,
            totalMarks: '100',
            weightage: '10',
            dueDate: '',
            allowSubmissions: true,
            externalLink: '',
            isVideoLink: false,
        }
    });

    const formData = watch();

    const onSubmit = async (data: AssessmentFormData) => {
        dispatch({ type: 'UI_START_PROCESSING', payload: 'assessment-submit' });
        try {
            const payload: CreateAssessmentRequest = {
                ...data,
                sectionId,
                courseId,
                totalMarks: Number(data.totalMarks),
                weightage: Number(data.weightage),
                dueDate: data.dueDate || undefined,
                allowSubmissions: data.allowSubmissions,
                externalLink: data.externalLink || undefined,
                isVideoLink: data.isVideoLink,
            };

            let savedAssessment: Assessment;
            if (assessmentId) {
                savedAssessment = await api.org.updateAssessment(assessmentId, payload as UpdateAssessmentRequest, token!);
            } else {
                savedAssessment = await api.org.createAssessment(payload, token!);
            }

            if (selectedFile) {
                // Determine orgId from initialData or token/context (assuming teacher creates within their org context, 
                // the section belongs to org. But api.files expects orgId. We can get it from savedAssessment parsing).
                // Or simply pass savedAssessment.organizationId since it's returned by backend DTO.
                const orgId = savedAssessment.organizationId || (initialData?.organizationId as string);
                try {
                    await api.files.uploadFile(orgId, 'ASSESSMENT', savedAssessment.id, selectedFile, token!);
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Assessment saved but file upload failed';
                    dispatch({ type: 'TOAST_ADD', payload: { message: String(message), type: 'error' } });
                }
            }

            window.dispatchEvent(new Event('stats-updated'));
            dispatch({ type: 'TOAST_ADD', payload: { message: `Assessment ${assessmentId ? 'updated' : 'created'} successfully.`, type: 'success' } });
            onSuccess?.(savedAssessment);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to save assessment';
            dispatch({ type: 'TOAST_ADD', payload: { message: Array.isArray(message) ? message[0] : message, type: 'error' } });
        } finally {
            dispatch({ type: 'UI_STOP_PROCESSING', payload: 'assessment-submit' });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
            <div className="space-y-4 md:space-y-6">
                <div className="space-y-2 md:space-y-3">
                    <Label htmlFor="title">Assessment Title</Label>
                    <Input
                        id="title"
                        type="text"
                        {...register('title')}
                        error={!!errors.title}
                        icon={FileText}
                        placeholder="e.g. Midterm Exam, Assignment 1"
                        className="font-medium"
                    />
                    {errors.title && <p className="text-xs text-red-500 font-semibold">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
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
                        {errors.type && <p className="text-xs text-red-500 font-semibold">{errors.type.message}</p>}
                    </div>

                    <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            {...register('dueDate')}
                            error={!!errors.dueDate}
                            icon={Calendar}
                            className="font-medium"
                        />
                        {errors.dueDate && <p className="text-xs text-red-500 font-semibold">{errors.dueDate.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="totalMarks">Total Marks</Label>
                        <Input
                            id="totalMarks"
                            type="number"
                            {...register('totalMarks')}
                            error={!!errors.totalMarks}
                            icon={BookOpen}
                            placeholder="100"
                            className="font-medium"
                        />
                        {errors.totalMarks && <p className="text-xs text-red-500 font-semibold">{errors.totalMarks.message}</p>}
                    </div>

                    <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="weightage">Weightage (%)</Label>
                        <Input
                            id="weightage"
                            type="number"
                            {...register('weightage')}
                            error={!!errors.weightage}
                            icon={Percent}
                            placeholder="10"
                            className="font-medium"
                        />
                        {errors.weightage && <p className="text-xs text-red-500 font-semibold">{errors.weightage.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
                        <div className="flex justify-between items-center mb-1">
                            <Label htmlFor="externalLink">External Link (Optional)</Label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground font-semibold hover:text-foreground transition-colors">
                                <span className={watch('isVideoLink') ? 'text-primary' : 'text-muted-foreground'}>Embed as Video</span>
                                <div className="relative inline-flex items-center">
                                    <input type="checkbox" className="sr-only peer" {...register('isVideoLink')} />
                                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-card after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-card after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                            </label>
                        </div>
                        <Input
                            id="externalLink"
                            type="url"
                            {...register('externalLink')}
                            error={!!errors.externalLink}
                            icon={LinkIcon}
                            placeholder="https://youtube.com/..."
                            disabled={isProcessing}
                            className="font-medium"
                        />
                        {errors.externalLink && <p className="text-xs text-red-500 font-semibold">{errors.externalLink.message}</p>}
                    </div>

                    <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <Label>Attachment (Optional)</Label>
                            {selectedFile && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                                        if (fileInput) fileInput.value = '';
                                    }}
                                    className="p-1 shrink-0 border border-red-500/60 hover:border-red-500 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-all shadow-sm"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="relative flex items-center gap-2">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setSelectedFile(e.target.files[0]);
                                    }
                                }}
                                accept=".txt,.pdf,image/*,.docx,.xlsx,.pptx,.zip"
                            />
                            <Label
                                htmlFor="file-upload"
                                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl cursor-pointer transition-all flex-1 ${selectedFile ? 'border-primary/50 bg-primary/5 text-primary shadow-sm' : 'border-border hover:border-primary/30 text-muted-foreground bg-card/50 hover:bg-card'}`}
                            >
                                <UploadCloud className="w-4 h-4" />
                                <span className="truncate text-sm font-semibold flex-1">
                                    {selectedFile ? selectedFile.name : 'Choose file...'}
                                </span>
                                {selectedFile && <Check className="w-4 h-4 text-emerald-500" />}
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 md:p-5 bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent opacity-50" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                        <Toggle
                            checked={watch('allowSubmissions')}
                            onCheckedChange={(checked) => setValue('allowSubmissions', checked)}
                            label="Allow Submissions"
                            description="Enable students to upload work for this assessment"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-border/50">
                <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto h-12 font-semibold">
                    Cancel
                </Button>
                <Button type="submit" loadingId="assessment-submit" loadingText="Saving..." className="w-full sm:w-auto h-12 font-semibold">
                    {assessmentId ? 'Update Assessment' : 'Create Assessment'}
                </Button>
            </div>
        </form>
    );
}
