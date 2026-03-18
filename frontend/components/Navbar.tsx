'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, UserPlus, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { Role } from '@/types';
import { OrgLogoOrIcon } from './ui/OrgLogoOrIcon';


export default function Navbar() {
    const { token, user } = useAuth();
    const { toggleMobileSidebar, isMobileOpen } = useUI();
    const pathname = usePathname();

    const isDashboard = pathname?.includes('/dashboard') || pathname?.startsWith('/admin/dashboard') || pathname?.split('/')[2] === 'dashboard';

    return (
        <nav className="fixed top-0 left-0 right-0 z-100 flex items-center justify-between px-4 py-3 md:px-10 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] h-16 transition-all duration-300">
            <div className="flex items-center space-x-2 md:space-x-4">
                {isDashboard && (
                    <button
                        onClick={toggleMobileSidebar}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-sm transition-colors text-gray-600 outline-none focus-visible:ring-2 ring-primary"
                        title={isMobileOpen ? "Close Menu" : "Open Menu"}
                    >
                        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                )}
                <Link href={user?.orgName ? `/${user.orgSlug}/dashboard` : '/'} className="flex items-center space-x-3 group outline-none">
                    <OrgLogoOrIcon logoUrl={user?.orgLogoUrl} orgName={user?.orgName} />
                    <span className="text-lg md:text-2xl font-bold text-primary tracking-tight truncate max-w-[120px] sm:max-w-none">
                        {user?.orgName || 'EduManage'}
                    </span>
                </Link>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
                {token && user ? (
                    <div className="flex items-center space-x-2">
                        {!pathname.includes('/dashboard') && (
                            <Link
                                href={
                                    user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN
                                        ? '/admin/dashboard'
                                        : user.role === Role.STUDENT && user.name
                                            ? `/${user.orgSlug}/${user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`
                                            : `/${user.orgSlug}/dashboard`
                                }
                                className="flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2.5 rounded-sm transition-all duration-300 font-medium shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-100"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center p-1 rounded-sm bg-secondary/20 shadow-inner border border-secondary/10">
                        <Link
                            href="/login"
                            className={`flex items-center mr-1 md:mr-2 space-x-2 px-3 py-2 md:px-5 md:py-2.5 rounded-sm transition-all duration-300 font-medium text-xs md:text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary ${pathname === '/login'
                                ? 'bg-primary text-primary-text shadow-lg'
                                : 'text-gray-600 hover:text-primary hover:bg-white'
                                }`}
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Login</span>
                        </Link>
                        <Link
                            href="/register"
                            className={`flex items-center space-x-2 px-3 py-2 md:px-5 md:py-2.5 rounded-sm transition-all duration-300 font-medium text-xs md:text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary ${pathname === '/register'
                                ? 'bg-primary text-primary-text shadow-lg'
                                : 'text-gray-600 hover:text-primary hover:bg-white'
                                }`}
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Register</span>
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
