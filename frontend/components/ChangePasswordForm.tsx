'use client';

import { useState } from 'react';
import { Lock, AlertCircle, ShieldCheck } from 'lucide-react';

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
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData.oldPassword, formData.newPassword);
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="w-full max-w-md space-y-8 bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white relative z-10 transition-all duration-300 mx-auto">
            <div className="text-center">
                <div className="mx-auto bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
                    <ShieldCheck className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="mt-2 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">
                    {title}
                </h2>
                <p className="mt-3 text-sm text-gray-500">
                    {description}
                </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-red-700 font-medium">{error}</div>
                    </div>
                )}

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
                        className="group relative flex w-full justify-center items-center space-x-2 rounded-xl border border-transparent bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:hover:translate-y-0 transition-all duration-200"
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
