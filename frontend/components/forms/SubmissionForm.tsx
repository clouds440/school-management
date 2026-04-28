'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload, FileCheck } from 'lucide-react';
import { Submission } from '@/types';

const submissionSchema = z.object({
    fileUrl: z.string().url('Please provide a valid URL for your submission').or(z.literal('')),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

interface SubmissionFormProps {
    assessmentId: string;
    onSuccess: (submission: Submission) => void;
    onCancel: () => void;
}

export default function SubmissionForm({ assessmentId, onSuccess, onCancel }: SubmissionFormProps) {
    const { token } = useAuth();
    const { dispatch } = useGlobal();

    const { register, handleSubmit, formState: { errors } } = useForm<SubmissionFormValues>({
        resolver: zodResolver(submissionSchema),
        defaultValues: {
            fileUrl: '',
        }
    });

    const onSubmit = async (data: SubmissionFormValues) => {
        if (!token) return;
        dispatch({ type: 'UI_START_PROCESSING', payload: 'submission-submit' });
        try {
            const submission = await api.org.createSubmission(assessmentId, {
                assessmentId,
                fileUrl: data.fileUrl || undefined,
            }, token);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Work submitted successfully!', type: 'success' } });
            onSuccess(submission);
        } catch (error: unknown) {
            console.error('Submission failed:', error);
            const message = error instanceof Error ? error.message : 'Failed to submit work';
            dispatch({ type: 'TOAST_ADD', payload: { message: Array.isArray(message) ? message[0] : message, type: 'error' } });
        } finally {
            dispatch({ type: 'UI_STOP_PROCESSING', payload: 'submission-submit' });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
            {/* Upload Section */}
            <div className="bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 text-center border-dashed relative group overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative">
                    <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <div className="relative p-4 bg-linear-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-foreground mb-2">Upload Your Work</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                        Provide a link to your project repository, document, or hosted file for evaluation.
                    </p>
                </div>
            </div>

            {/* URL Input */}
            <div className="space-y-3">
                <label className="text-xs md:text-sm font-semibold tracking-wider text-muted-foreground ml-1">Submission URL</label>
                <Input
                    placeholder="https://github.com/your-repo or https://drive.google.com/..."
                    error={!!errors.fileUrl}
                    {...register('fileUrl')}
                    className="font-medium placeholder:text-muted-foreground/40"
                />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-border/50">
                <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto h-12 font-semibold">
                    Cancel
                </Button>
                <Button type="submit" loadingId="submission-submit" loadingText="Submitting..." className="w-full sm:w-auto h-12 font-semibold flex items-center justify-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Submit Final Work
                </Button>
            </div>
        </form>
    );
}
