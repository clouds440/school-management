'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload, FileCheck } from 'lucide-react';

const submissionSchema = z.object({
    fileUrl: z.string().url('Please provide a valid URL for your submission').or(z.literal('')),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

interface SubmissionFormProps {
    assessmentId: string;
    onSuccess: (submission: any) => void;
    onCancel: () => void;
}

export default function SubmissionForm({ assessmentId, onSuccess, onCancel }: SubmissionFormProps) {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<SubmissionFormValues>({
        resolver: zodResolver(submissionSchema),
        defaultValues: {
            fileUrl: '',
        }
    });

    const onSubmit = async (data: SubmissionFormValues) => {
        if (!token) return;
        setIsSubmitting(true);
        try {
            const submission = await api.org.createSubmission(assessmentId, {
                assessmentId,
                fileUrl: data.fileUrl || undefined,
            }, token);
            showToast('Work submitted successfully!', 'success');
            onSuccess(submission);
        } catch (error) {
            console.error('Submission failed:', error);
            showToast('Failed to submit work', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-primary/5 border border-white/10 rounded-sm p-8 text-center border-dashed relative group overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <Upload className="w-12 h-12 text-primary/40 mx-auto mb-4 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-card-text mb-2">Upload Your Work</h3>
                <p className="text-[10px] font-black text-card-text/40 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    Provide a link to your project repository, document, or hosted file for evaluation.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-card-text/40 ml-1">Submission URL</label>
                <Input
                    placeholder="https://github.com/your-repo / https://drive.google.com/..."
                    error={!!errors.fileUrl}
                    {...register('fileUrl')}
                    className="font-black italic uppercase tracking-tight placeholder:not-italic placeholder:text-card-text/20"
                />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                <Button type="button" variant="secondary" onClick={onCancel} className="px-8 h-12 font-black italic uppercase tracking-widest text-xs">
                    Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="px-10 h-12 font-black italic uppercase tracking-widest text-xs flex gap-2">
                    <FileCheck className="w-4 h-4" />
                    Submit Final Work
                </Button>
            </div>
        </form>
    );
}
