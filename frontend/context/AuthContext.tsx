'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { Role } from '@/types';


export interface JwtPayload {
    sub: string;
    id: string; // Add id to avoid mapping issues
    email: string;
    name?: string;
    orgSlug?: string;
    orgName?: string;
    orgLogoUrl?: string | null;
    role?: Role;
    designation?: string;
    type?: string;
    status?: string;
    isFirstLogin?: boolean;

    iat: number;
    exp: number;
}

interface AuthContextType {
    token: string | null;
    user: JwtPayload | null;
    loading: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<JwtPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();


    useEffect(() => {
        // Initialize token from storage
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            processToken(storedToken);
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Route guarding
        if (!loading) {
            const isAdminPath = pathname?.startsWith('/admin');
            const isGuestPath = ['/login', '/register'].includes(pathname || '');
            const isHomePage = pathname === '/';
            const isSupportPage = pathname === '/support';

            // A user path is anything that's not guest, not admin, and not home (and not support)
            const isUserPath = pathname && !isAdminPath && !isGuestPath && !isHomePage && !isSupportPage;


            if (user) {
                // If it's first login and admin, always force change password
                if ((user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) && user.isFirstLogin && pathname !== '/admin/change-password') {
                    router.replace('/admin/change-password');
                    return;
                }

                // Redirect away from guest paths (login/register/home)
                if (isGuestPath) {
                    if (user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) {
                        router.replace('/admin/dashboard');
                    } else if (user.orgSlug) {
                        if (user.role === Role.STUDENT && user.name) {
                            const nameSlug = user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                            router.replace(`/${user.orgSlug}/${nameSlug}`);
                        } else {
                            router.replace(`/${user.orgSlug}/dashboard`);
                        }
                    }
                    return;
                }

                // Cross-role protection
                if (isAdminPath && user.role !== Role.SUPER_ADMIN && user.role !== Role.PLATFORM_ADMIN) {
                    if (user.orgSlug) {
                        router.replace(`/${user.orgSlug}/dashboard`);
                    } else {
                        router.replace('/');
                    }
                    return;
                }

                if (isUserPath && (user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN)) {
                    router.replace('/admin/dashboard');
                    return;
                }

                // Verify organization slug matches the URL for Org roles
                if (isUserPath && user.orgSlug) {
                    const firstSegment = pathname.split('/')[1];

                    // Check if student is on their personalized page or dashboard (redirect to personalized if on dashboard)
                    if (user.role === Role.STUDENT) {
                        const nameSlug = user.name ? user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : '';

                        if (firstSegment !== user.orgSlug) {
                            router.replace(`/${user.orgSlug}/${nameSlug || 'dashboard'}`);
                            return;
                        }

                        // If student hits generic /dashboard, redirect to personalized name route or fallback
                        if (pathname === `/${user.orgSlug}/dashboard` || pathname === `/${user.orgSlug}`) {
                            if (nameSlug) {
                                router.replace(`/${user.orgSlug}/${nameSlug}`);
                                return;
                            }
                        }
                    } else if (user.role === Role.ORG_ADMIN || user.role === Role.ORG_MANAGER || user.role === Role.TEACHER) {
                        if (firstSegment !== user.orgSlug) {
                            router.replace(`/${user.orgSlug}/dashboard`);
                            return;
                        }

                        // Restrict TEACHER from accessing settings and teachers management pages
                        if (user.role === Role.TEACHER) {
                            const pathSegments = pathname.split('/');
                            if (pathSegments.includes('settings') || pathSegments.includes('teachers')) {
                                router.replace(`/${user.orgSlug}/dashboard`);
                                return;
                            }
                        }
                    }
                }
            } else {
                // Not logged in
                if (isAdminPath || isUserPath || isSupportPage) {
                    router.replace('/login');
                }
            }
        }
    }, [user, loading, pathname, router]);

    // --- Dynamic tab title ---
    useEffect(() => {
        if (loading) return;
        if (!user) { document.title = 'EduManage'; return; }

        const orgSuffix = user.orgName || 'EduManage';

        switch (user.role) {
            case Role.SUPER_ADMIN:
            case Role.PLATFORM_ADMIN:
                document.title = `Admin – EduManage`;
                break;
            case Role.ORG_ADMIN:
                document.title = `Admin – ${orgSuffix}`;
                break;
            case Role.ORG_MANAGER:
                document.title = `${user.name || 'Manager'} – ${orgSuffix}`;
                break;
            case Role.TEACHER:
                document.title = `${user.name || 'Teacher'} – ${orgSuffix}`;
                break;
            case Role.STUDENT:
                document.title = `${user.name || 'Student'} – ${orgSuffix}`;
                break;
            default:
                document.title = orgSuffix;
        }
    }, [user, loading, pathname]);

    const processToken = (t: string) => {

        try {
            const base64Url = t.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            const decoded = JSON.parse(jsonPayload) as JwtPayload;

            // Check expiration
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                showToast('Your session has expired. Please log in again.', 'info');
                logout();
                return;
            }


            setToken(t);
            setUser(decoded);
            localStorage.setItem('token', t);
        } catch (e) {
            console.warn('Invalid or expired token sessions cleaned up.');
            logout();
        } finally {

            setLoading(false);
        }
    };

    const login = (newToken: string) => {
        processToken(newToken);
    };

    const logout = async () => {
        if (token) {
            try {
                await api.auth.logout(token);
            } catch (error) {
                console.error("Backend logout failed", error);
            }
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ token, user, loading, login, logout }}>
            {loading ? (
                // Block all rendering until auth state is resolved — eliminates
                // every flash-of-wrong-content, premature 404, and route flicker.
                <div className="fixed inset-0 bg-linear-to-br from-primary/5 via-white to-primary/10 flex flex-col items-center justify-center z-9999">
                    <div className="flex flex-col items-center gap-6">
                        {/* Animated logo mark */}
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-2xl bg-primary animate-pulse opacity-20" />
                            <div className="absolute inset-0 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                </svg>
                            </div>
                        </div>
                        {/* Spinner */}
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full border-[3px] border-primary/10" />
                            <div className="w-8 h-8 rounded-full border-[3px] border-transparent border-t-primary animate-spin absolute inset-0" />
                        </div>
                        <p className="text-sm font-semibold text-gray-400 tracking-widest uppercase animate-pulse">Loading…</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
