'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, setUnauthorizedHandler } from '@/lib/api';
import { Role } from '@/types';
import { useGlobal, JwtPayload } from './GlobalContext';
import { PLATFORM_NAME, DASHBOARD_MODULES } from '@/lib/constants';
import { clearChatSession } from '@/lib/chatStore';
import { disconnectSocket } from '@/hooks/useSocket';

export type { JwtPayload };

interface AuthContextType {
    token: string | null;
    user: JwtPayload | null;
    loading: boolean;
    login: (token: string) => void;
    logout: () => void;
    updateUser: (data: Partial<JwtPayload>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { state, dispatch } = useGlobal();
    const { token, user, loading } = state.auth;
    const router = useRouter();
    const pathname = usePathname();

    const logout = React.useCallback(async () => {
        const currentToken = token;
        localStorage.removeItem('token');
        localStorage.removeItem('themeMode');
        clearChatSession();
        disconnectSocket();
        dispatch({ type: 'AUTH_LOGOUT' });
        router.replace('/login');
        if (currentToken) {
            api.auth.logout(currentToken).catch(() => { });
        }
    }, [token, router, dispatch]);

    const processToken = React.useCallback((t: string) => {
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

            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Your session has expired. Please log in again.', type: 'info' } });
                logout();
                return;
            }

            if (decoded.name) {
                decoded.userName = decoded.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            }
            if (decoded.sub && !decoded.id) decoded.id = decoded.sub;

            localStorage.setItem('token', t);
            dispatch({ type: 'AUTH_SET_SESSION', payload: { user: decoded, token: t } });
        } catch (error) {
            console.warn('Invalid token', error);
            logout();
        }
    }, [logout, dispatch]);

    // Register global 401 handler
    useEffect(() => {
        setUnauthorizedHandler((failedToken) => {
            const currentToken = localStorage.getItem('token');
            // Only trigger if the failure was for our actual current token
            // This prevents race conditions when switching accounts
            if (currentToken && (!failedToken || failedToken === currentToken)) {
                localStorage.removeItem('token');
                clearChatSession();
                disconnectSocket();
                dispatch({ type: 'AUTH_LOGOUT' });
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Your session has expired. Please log in again.', type: 'info' } });
                router.replace('/login');
            }
        });
    }, [dispatch, router]);

    useEffect(() => {
        if (!loading) {
            const segments = pathname?.split('/').filter(Boolean) || [];

            const isAdminPath = segments[0] === 'admin';
            const isGuestPath = segments.length === 1 && (segments[0] === 'login' || segments[0] === 'register');
            // A path is considered a "User/Dashboard" path if:
            // 1. It starts with /admin (Platform Admin)
            // 2. It has at least 1 segment and the first segment is a known dashboard module
            const isUserPath = isAdminPath || (segments.length >= 1 && DASHBOARD_MODULES.includes(segments[0]));

            if (user) {
                if ((user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) && user.isFirstLogin && pathname !== '/admin/change-password') {
                    router.replace('/admin/change-password');
                    return;
                }

                if (isGuestPath) {
                    if (user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) {
                        router.replace('/admin');
                    } else {
                        if (user.role === Role.STUDENT) router.replace(`/students/${user.userName}`);
                        else if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) router.replace(`/teachers/${user.userName}`);
                        else if (user.role === Role.ORG_ADMIN) router.replace('/overview');
                        else router.replace('/');
                    }
                    return;
                }

                if (isAdminPath && user.role !== Role.SUPER_ADMIN && user.role !== Role.PLATFORM_ADMIN) {
                    router.replace('/');
                    return;
                }

                if (isUserPath && (user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN)) {
                    // Only redirect if they are NOT on an admin path (meaning they are on an org path)
                    if (!isAdminPath) {
                        router.replace('/admin');
                        return;
                    }
                }

                if (isUserPath) {
                    const pathSegments = pathname.split('/');

                    if (user.role === Role.STUDENT) {
                        const isStudentPortal = pathSegments[1] === 'students' && pathSegments[2] === user.userName;
                        const isSupportInOrg = pathSegments[1] === 'mail';
                        const isAllowedShared = ['chat', 'timetable', 'attendance'].includes(pathSegments[1]);
                        const isSettingsPage = pathSegments.includes('settings');

                        if (isSettingsPage) {
                            // Settings page handles its own redirect, no toast needed
                            router.replace(`/students/${user.userName}?tab=profile`);
                            return;
                        }

                        if (!isStudentPortal && !isSupportInOrg && !isAllowedShared) {
                            dispatch({ type: 'TOAST_ADD', payload: { message: 'Access Denied.', type: 'error' } });
                            router.replace(`/students/${user.userName}`);
                            return;
                        }
                    } else if (user.role === Role.ORG_MANAGER) {
                        const isSettingsPage = pathSegments.includes('settings');
                        if (isSettingsPage) {
                            // Settings page handles its own redirect, no toast needed
                            router.replace(`/teachers/${user.userName}/profile`);
                            return;
                        }
                    } else if (user.role === Role.TEACHER) {
                        const isTeacherList = pathSegments[1] === 'teachers' && !pathSegments[2];
                        const isSettingsPage = pathSegments.includes('settings');
                        if (isSettingsPage) {
                            // Settings page handles its own redirect, no toast needed
                            router.replace(`/teachers/${user.userName}/profile`);
                            return;
                        }
                        if (isTeacherList) {
                            dispatch({ type: 'TOAST_ADD', payload: { message: 'Access Denied.', type: 'error' } });
                            router.replace(`/teachers/${user.userName}`);
                            return;
                        }
                    }
                }
            } else if (isAdminPath || isUserPath) {
                router.replace('/login');
            }
        }
    }, [user, loading, pathname, router, dispatch]);

    useEffect(() => {
        if (loading) return;
        if (!user) { document.title = PLATFORM_NAME; return; }
        const orgSuffix = user.orgName || PLATFORM_NAME;
        switch (user.role) {
            case Role.SUPER_ADMIN:
            case Role.PLATFORM_ADMIN: document.title = `Admin – ${PLATFORM_NAME}`; break;
            case Role.ORG_ADMIN: document.title = `Admin – ${orgSuffix}`; break;
            case Role.ORG_MANAGER: document.title = `${user.name || 'Manager'} – ${orgSuffix}`; break;
            case Role.TEACHER: document.title = `${user.name || 'Teacher'} – ${orgSuffix}`; break;
            case Role.STUDENT: document.title = `${user.name || 'Student'} – ${orgSuffix}`; break;
            default: document.title = orgSuffix;
        }
    }, [user, loading, pathname]);

    const login = (newToken: string) => processToken(newToken);
    const updateUser = (data: Partial<JwtPayload>) => dispatch({ type: 'AUTH_UPDATE_USER', payload: data });

    return (
        <AuthContext.Provider value={{ token, user, loading, login, logout, updateUser }}>
            {loading ? (
                <div className="fixed inset-0 bg-linear-to-br from-primary/5 via-background to-primary/10 flex flex-col items-center justify-center z-9999">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-2xl bg-primary animate-pulse opacity-20" />
                            <div className="absolute inset-0 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                </svg>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full border-[3px] border-primary/10" />
                            <div className="w-8 h-8 rounded-full border-[3px] border-transparent border-t-primary animate-spin absolute inset-0" />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground tracking-widest uppercase animate-pulse">Loading…</p>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
