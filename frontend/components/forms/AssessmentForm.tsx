'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Calendar, Type, FileText, Percent, UploadCloud, Link as LinkIcon, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useGlobal } from '@/context/GlobalContext';
import { Assessment, AssessmentType, CreateAssessmentRequest, UpdateAssessmentRequest, ApiError } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useForm } from 'react-hook-form';
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
    const { state, dispatch } = useGlobal();
    const isProcessing = state.ui.isProcessing;

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
        dispatch({ type: 'UI_SET_PROCESSING', payload: true });
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
                    showToast(message, 'error');
                }
            }

            window.dispatchEvent(new Event('stats-updated'));
            showToast(`Assessment ${assessmentId ? 'updated' : 'created'} successfully.`, 'success');
            onSuccess?.(savedAssessment);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const message = apiError?.response?.data?.message || 'Failed to save assessment';
            showToast(Array.isArray(message) ? message[0] : message, 'error');
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <Label htmlFor="externalLink">External Link (Optional)</Label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-400 font-bold uppercase hover:text-gray-400 transition-colors">
                                <span className={watch('isVideoLink') ? 'text-primary' : 'text-gray-400'}>Embed as Video</span>
                                <div className="relative inline-flex items-center">
                                    <input type="checkbox" className="sr-only peer" {...register('isVideoLink')} />
                                    <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
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
                        />
                        {errors.externalLink && <p className="text-xs text-red-500 font-bold">{errors.externalLink.message}</p>}
                    </div>

                    <div className="space-y-2">
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
                                    className="px-1 shrink-0 border border-red-500/60 hover:border-red-500/50 bg-white/5 hover:bg-red-500/10 text-card-text/40 hover:text-red-500 rounded-sm transition-colors shadow-sm"
                                >
                                    <X className="w-5 h-5" />
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
                                className={`flex items-center gap-2 px-3 py-2 border rounded-sm cursor-pointer transition-colors flex-1 ${selectedFile ? 'border-primary/50 bg-primary/5 text-primary' : 'border-white/10 hover:border-white/20 text-gray-400 bg-white/5'}`}
                            >
                                <UploadCloud className="w-4 h-4" />
                                <span className="truncate text-sm font-bold flex-1">
                                    {selectedFile ? selectedFile.name : 'Choose file...'}
                                </span>
                                {selectedFile && <Check className="w-4 h-4 text-emerald-500" />}
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-sm">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-gray-300">Allow Submissions</Label>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Enable students to upload work for this assessment</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" {...register('allowSubmissions')} />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isProcessing}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? (
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
