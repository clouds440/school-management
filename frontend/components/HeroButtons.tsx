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
                                ? '/admin'
                                : user.role === Role.TEACHER || user.role === Role.ORG_MANAGER
                                    ? `/teachers/${user.userName}`
                                    : `/students/${user.userName}`
                    }
                    className="bg-primary text-white px-8 py-3 rounded-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg"
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
                className="bg-primary text-white px-8 py-3 rounded-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg"
            >
                Start Free Trial
            </Link>
            <Link
                href="#features"
                className="bg-card/80 backdrop-blur-sm text-foreground px-8 py-3 rounded-sm font-semibold border border-border hover:bg-card transition-colors shadow-lg"
            >
                Learn More
            </Link>
        </div>
    );
}
