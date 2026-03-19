'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { BackButton } from '@/components/ui/BackButton';
import { Role } from '@/types';

export default function OrganizationChangePasswordPage() {
    const router = useRouter();
    const { token, login, user } = useAuth();

    const handleSubmit = async (oldPassword: string, newPassword: string) => {
        if (!token) return;
        const res = await api.auth.changePassword(oldPassword, newPassword, token);
        login(res.access_token);
    };

    return (
        <div className="flex flex-1 flex-col p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-1 items-center justify-center">
                <ChangePasswordForm
                    title="Change Password"
                    description={
                        (user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER')
                            ? `Update administrative password for ${user?.name || 'Organization'}`
                            : user?.role === 'TEACHER'
                                ? `Update teacher portal password for ${user?.name || 'User'}`
                                : `Update student portal password for ${user?.name || 'User'}`
                    }
                    onSubmit={handleSubmit}
                    onSuccess={() => {
                        if (!user || !user.orgSlug || !user.userName) {
                            router.push('/');
                            return;
                        }

                        const target = user.role === Role.ORG_ADMIN
                            ? `/${user.orgSlug}/admin`
                            : user.role === Role.STUDENT
                                ? `/${user.orgSlug}/students/${user.userName}`
                                : `/${user.orgSlug}/teachers/${user.userName}`;
                        router.push(target);
                    }}
                />
            </div>
        </div>
    );
}
