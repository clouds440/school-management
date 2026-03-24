'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default function AdminChangePasswordPage() {
    const router = useRouter();
    const { token, login, user } = useAuth();

    const handleSubmit = async (oldPassword: string, newPassword: string) => {
        if (!token) return;
        const res = await api.auth.changePassword(oldPassword, newPassword, token);
        login(res.access_token);
    };

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="flex flex-1 items-center justify-center">
                <ChangePasswordForm
                    title={user?.isFirstLogin ? 'Security Required' : 'Security Settings'}
                    description={user?.isFirstLogin
                        ? 'For security reasons, you must change the default super admin password before accessing the dashboard.'
                        : 'Update your super admin administrative password'}
                    onSubmit={handleSubmit}
                    onSuccess={() => router.push('/admin/dashboard')}
                />
            </div>
        </div>
    );
}

