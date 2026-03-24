'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Check, Edit3, MessageCircle, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { Grade, GradeStatus, UpdateGradeRequest, ApiError, Student } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gradeSchema, GradeFormData } from '@/lib/schemas';

interface GradingFormProps {
    assessmentId: string;
    student: Student;
    initialData?: Grade;
    totalMarks: number;
    onSuccess?: (grade: Grade) => void;
    onCancel?: () => void;
}

export default function GradingForm({
    assessmentId,
    student,
    initialData,
    totalMarks,
    onSuccess,
    onCancel
}: GradingFormProps) {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<GradeFormData>({
        resolver: zodResolver(gradeSchema),
        defaultValues: initialData ? {
            marksObtained: initialData.marksObtained.toString(),
            feedback: initialData.feedback || '',
            status: initialData.status,
        } : {
            marksObtained: '',
            feedback: '',
            status: GradeStatus.DRAFT,
        }
    });

    const formData = watch();

    const onSubmit: SubmitHandler<GradeFormData> = async (data) => {
        if (Number(data.marksObtained) > totalMarks) {
            showToast(`Marks obtained cannot exceed total marks (${totalMarks})`, 'error');
            return;
        }

        setIsSaving(true);
        try {
            const payload: UpdateGradeRequest = {
                marksObtained: Number(data.marksObtained),
                feedback: data.feedback || undefined,
                status: data.status,
            };

            const savedGrade = await api.org.updateGrade(assessmentId, student.id, payload, token!);

            showToast(`Grade updated for ${student.user.name}.`, 'success');
            onSuccess?.(savedGrade);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const message = apiError?.response?.data?.message || 'Failed to save grade';
            showToast(Array.isArray(message) ? message[0] : message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-sm border border-white/10 mb-6 font-bold italic">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black uppercase tracking-tighter italic">
                    {student.user.name.charAt(0)}
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-card-text">{student.user.name}</h4>
                    <p className="text-xs text-card-text/40">{student.rollNumber || 'No Roll Number'}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="marksObtained">Marks Obtained (out of {totalMarks})</Label>
                        <Input
                            id="marksObtained"
                            type="number"
                            {...register('marksObtained')}
                            error={!!errors.marksObtained}
                            icon={Star}
                            placeholder={`e.g. ${totalMarks / 100 * 85}`}
                        />
                        {errors.marksObtained && <p className="text-xs text-red-500 font-bold">{errors.marksObtained.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Grade Status</Label>
                        <CustomSelect
                            options={[
                                { value: GradeStatus.DRAFT, label: 'Draft' },
                                { value: GradeStatus.PUBLISHED, label: 'Published' },
                                { value: GradeStatus.FINALIZED, label: 'Finalized' },
                            ]}
                            value={formData.status || GradeStatus.DRAFT}
                            onChange={(val) => setValue('status', val as GradeStatus)}
                            error={!!errors.status}
                            icon={Edit3}
                        />
                        {errors.status && <p className="text-xs text-red-500 font-bold">{errors.status.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback (Optional)</Label>
                    <div className="relative group">
                        <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-card-text/40 group-focus-within:text-primary">
                            <MessageCircle className="h-5 w-5" />
                        </div>
                        <textarea
                            id="feedback"
                            {...register('feedback')}
                            className="w-full pl-11 pr-4 py-3 rounded-sm border border-white/10 ring-primary/10 bg-primary/5 text-card-text placeholder:text-card-text/40 focus:bg-card focus:border-primary focus:ring-4 sm:text-sm transition-all duration-200 shadow-sm min-h-[120px] outline-none font-bold"
                            placeholder="Great job! Keep it up."
                        />
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
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span>Save Grade</span>
                        </div>
                    )}
                </Button>
            </div>
        </form>
    );
}
