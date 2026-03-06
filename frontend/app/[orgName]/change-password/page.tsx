'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/src/lib/api';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { BackButton } from '@/components/ui/BackButton';

export default function OrganizationChangePasswordPage() {
    const router = useRouter();
    const { token, login, user } = useAuth();

    const handleSubmit = async (oldPassword: string, newPassword: string) => {
        if (!token) return;
        const res = await api.auth.changePassword(oldPassword, newPassword, token);
        login(res.access_token);
    };

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-12">
                <BackButton />
            </div>

            <div className="flex flex-1 items-center justify-center">
                <ChangePasswordForm
                    title="Change Password"
                    description={
                        user?.role === 'ORG_ADMIN'
                            ? `Update administrative password for ${user?.name || 'Organization'}`
                            : user?.role === 'TEACHER'
                                ? `Update teacher portal password for ${user?.name || 'User'}`
                                : `Update student portal password for ${user?.name || 'User'}`
                    }
                    onSubmit={handleSubmit}
                    onSuccess={() => {
                        const nameSlug = user?.role === 'STUDENT' && user?.name
                            ? user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                            : 'dashboard';
                        router.push(`/${user?.orgSlug || ''}/${nameSlug}`);
                    }}
                />
            </div>
        </div>
    );
}
