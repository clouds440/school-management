'use client';

import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { useGlobal } from '@/context/GlobalContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

interface ChangePasswordFormProps {
    title?: string;
    description?: string;
    onSubmit: (oldPassword: string, newPassword: string) => Promise<void>;
    onSuccess?: () => void;
}

export default function ChangePasswordForm({
    title = 'Change Password',
    description = 'Update your account password.',
    onSubmit,
    onSuccess
}: ChangePasswordFormProps) {
    const { state, dispatch } = useGlobal();
    const isProcessing = state.ui.isProcessing;

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'New passwords do not match', type: 'error' } });
            return;
        }

        if (formData.newPassword.length < 6) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Password must be at least 6 characters long', type: 'error' } });
            return;
        }

        dispatch({ type: 'UI_SET_PROCESSING', payload: { isProcessing: true, id: 'password-change-submit' } });
        try {
            await onSubmit(formData.oldPassword, formData.newPassword);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Password changed successfully', type: 'success' } });
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
            dispatch({ type: 'TOAST_ADD', payload: { message: errorMessage, type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="w-full max-w-lg space-y-8 bg-card text-card-text backdrop-blur-2xl p-10 sm:p-12 rounded-sm shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-white/50 relative z-10 mx-auto transition-all duration-500">
            <div className="text-center">
                <div className="mx-auto bg-primary/10 w-20 h-20 rounded-sm flex items-center justify-center mb-8 shadow-inner border border-white/20">
                    <ShieldCheck className="w-10 h-10 text-primary drop-shadow-sm" />
                </div>
                <h2 className="text-4xl font-black tracking-tight mb-4">
                    {title}
                </h2>
                <p className="opacity-70 font-medium text-lg">
                    {description}
                </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-5">
                    <div>
                        <Label>Current Password</Label>
                        <Input
                            name="oldPassword"
                            type="password"
                            required
                            placeholder="••••••••"
                            icon={Lock}
                            value={formData.oldPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <Label>New Password</Label>
                        <Input
                            name="newPassword"
                            type="password"
                            required
                            placeholder="••••••••"
                            icon={Lock}
                            value={formData.newPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <Label>Confirm New Password</Label>
                        <Input
                            name="confirmPassword"
                            type="password"
                            required
                            placeholder="••••••••"
                            icon={Lock}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <Button type="submit" loadingId="password-change-submit" loadingText="CHANGING..." className="w-full">
                        Change Password
                    </Button>
                </div>
            </form>
        </div>
    );
}
