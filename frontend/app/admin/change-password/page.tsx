'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/src/lib/api';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default function AdminChangePasswordPage() {
    const router = useRouter();
    const { token, login, user } = useAuth();

    const handleSubmit = async (oldPassword: string, newPassword: string) => {
        if (!token) return;
        const res = await api.admin.changePassword(oldPassword, newPassword, token);
        login(res.access_token);
    };

    return (
        <div className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50">
            {/* Background blobs omitted for brevity - wait actually I should keep them for aesthetics */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl pointer-events-none">
                <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 left-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <ChangePasswordForm
                title={user?.isFirstLogin ? 'Security Required' : 'Change Password'}
                description={user?.isFirstLogin
                    ? 'For security reasons, you must change the default super admin password before accessing the dashboard.'
                    : 'Update your super admin password.'}
                onSubmit={handleSubmit}
                onSuccess={() => router.push('/dashboard/admin')}
            />
        </div>
    );
}

