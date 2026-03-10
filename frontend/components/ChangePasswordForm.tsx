'use client';

import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
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
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (formData.newPassword.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData.oldPassword, formData.newPassword);
            showToast('Password changed successfully', 'success');
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="w-full max-w-lg space-y-8 bg-white/70 backdrop-blur-2xl p-10 sm:p-12 rounded-sm shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-white/50 relative z-10 mx-auto transition-all duration-500">
            <div className="text-center">
                <div className="mx-auto bg-indigo-500/10 w-20 h-20 rounded-sm flex items-center justify-center mb-8 shadow-inner border border-white/20">
                    <ShieldCheck className="w-10 h-10 text-indigo-100 drop-shadow-sm" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
                    {title}
                </h2>
                <p className="text-gray-600 font-medium text-lg">
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
                    <Button type="submit" isLoading={loading} loadingText="Updating..." className="w-full">
                        Change Password
                    </Button>
                </div>
            </form>
        </div>
    );
}
