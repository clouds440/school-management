'use client';

import { useState } from 'react';
import { Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

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
        <div className="w-full max-w-lg space-y-8 bg-white/70 backdrop-blur-2xl p-10 sm:p-12 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-white/50 relative z-10 mx-auto transition-all duration-500">
            <div className="text-center">
                <div className="mx-auto bg-indigo-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-white/20">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 pl-1">
                            Current Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                name="oldPassword"
                                type="password"
                                required
                                className="block w-full rounded-xl border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm"
                                placeholder="••••••••"
                                value={formData.oldPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 pl-1">
                            New Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                name="newPassword"
                                type="password"
                                required
                                className="block w-full rounded-xl border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm"
                                placeholder="••••••••"
                                value={formData.newPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 pl-1">
                            Confirm New Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="block w-full rounded-xl border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center items-center space-x-3 rounded-2xl border border-transparent bg-indigo-600 py-4 px-6 text-lg font-bold text-white hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:bg-indigo-300 disabled:hover:translate-y-0 transition-all duration-300 shadow-xl"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Updating...</span>
                            </>
                        ) : (
                            <span>Change Password</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
