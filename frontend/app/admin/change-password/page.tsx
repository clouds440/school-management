'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/src/lib/api';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { BackButton } from '@/components/ui/BackButton';

export default function AdminChangePasswordPage() {
    const router = useRouter();
    const { token, login, user } = useAuth();

    const handleSubmit = async (oldPassword: string, newPassword: string) => {
        if (!token) return;
        const res = await api.admin.changePassword(oldPassword, newPassword, token);
        login(res.access_token);
    };

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-12">
                <BackButton />
            </div>

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

