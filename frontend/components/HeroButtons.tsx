'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

export function HeroButtons() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="h-12"></div>; // Placeholder to avoid layout shift
    }

    if (user) {
        return (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                    href={
                        user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN
                            ? '/admin'
                            : user.role === Role.ORG_ADMIN
                                ? `/${user.orgSlug}/admin`
                                : user.role === Role.TEACHER || user.role === Role.ORG_MANAGER
                                    ? `/${user.orgSlug}/teachers/${user.userName}`
                                    : `/${user.orgSlug}/students/${user.userName}`
                    }
                    className="bg-indigo-600 text-white px-8 py-3 rounded-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
                >
                    Go to Your Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
                href="/register"
                className="bg-indigo-600 text-white px-8 py-3 rounded-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
            >
                Start Free Trial
            </Link>
            <Link
                href="#features"
                className="bg-white/80 backdrop-blur-sm text-gray-800 px-8 py-3 rounded-sm font-semibold border border-gray-200 hover:bg-white transition-colors shadow-lg"
            >
                Learn More
            </Link>
        </div>
    );
}
