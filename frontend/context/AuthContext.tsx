'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface JwtPayload {
    sub: string;
    email: string;
    role?: string;
    type?: string;
    approved?: boolean;
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
            if (user && (pathname === '/login' || pathname === '/register')) {
                if (user.role === 'admin') {
                    router.replace('/dashboard/admin');
                } else {
                    router.replace('/dashboard');
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
