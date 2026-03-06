'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface JwtPayload {
    sub: string;
    id: string; // Add id to avoid mapping issues
    email: string;
    name?: string;
    orgSlug?: string;
    role?: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'TEACHER' | 'STUDENT';
    designation?: string;
    type?: string;
    approved?: boolean;
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

            // A user path is anything that's not guest, not admin, and not home
            const isUserPath = pathname && !isAdminPath && !isGuestPath && !isHomePage;

            if (user) {
                // If it's first login and admin, always force change password
                if (user.role === 'SUPER_ADMIN' && user.isFirstLogin && pathname !== '/admin/change-password') {
                    router.replace('/admin/change-password');
                    return;
                }

                // Redirect away from guest paths (login/register/home)
                if (isGuestPath) {
                    if (user.role === 'SUPER_ADMIN') {
                        router.replace('/admin/dashboard');
                    } else if (user.orgSlug) {
                        if (user.role === 'STUDENT' && user.name) {
                            const nameSlug = user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                            router.replace(`/${user.orgSlug}/${nameSlug}`);
                        } else {
                            router.replace(`/${user.orgSlug}/dashboard`);
                        }
                    }
                    return;
                }

                // Cross-role protection
                if (isAdminPath && user.role !== 'SUPER_ADMIN') {
                    if (user.orgSlug) {
                        router.replace(`/${user.orgSlug}/dashboard`);
                    } else {
                        router.replace('/');
                    }
                    return;
                }

                if (isUserPath && user.role === 'SUPER_ADMIN') {
                    router.replace('/admin/dashboard');
                    return;
                }

                // Verify organization slug matches the URL for Org roles
                if (isUserPath && user.orgSlug) {
                    const firstSegment = pathname.split('/')[1];

                    // Check if student is on their personalized page or dashboard (redirect to personalized if on dashboard)
                    if (user.role === 'STUDENT') {
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
                    } else if (user.role === 'ORG_ADMIN' || user.role === 'TEACHER') {
                        if (firstSegment !== user.orgSlug) {
                            router.replace(`/${user.orgSlug}/dashboard`);
                            return;
                        }

                        // Restrict TEACHER from accessing settings and teachers management pages
                        if (user.role === 'TEACHER') {
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
                if (isAdminPath || isUserPath) {
                    router.replace('/login');
                }
            }
        }
    }, [user, loading, pathname, router]);

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
                throw new Error('Token expired');
            }

            setToken(t);
            setUser(decoded);
            localStorage.setItem('token', t);
        } catch (e) {
            console.error('Invalid token', e);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (newToken: string) => {
        processToken(newToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ token, user, loading, login, logout }}>
            {children}
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
