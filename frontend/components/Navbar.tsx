'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { School, LogIn, UserPlus, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';

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
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-sm transition-colors text-gray-600 outline-none focus-visible:ring-2 ring-indigo-500"
                        title={isMobileOpen ? "Close Menu" : "Open Menu"}
                    >
                        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                )}
                <Link href={user?.orgName ? '/dashboard' : '/'} className="flex items-center space-x-3 group outline-none">
                    <div className="bg-indigo-50 p-2 md:p-2.5 rounded-sm md:rounded-sm group-hover:bg-indigo-100 group-hover:scale-105 group-focus-visible:ring-2 ring-indigo-500 transition-all duration-300 shrink-0">
                        <School className="w-6 h-6 md:w-7 md:h-7 text-indigo-600" />
                    </div>
                    <span className="text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 via-indigo-900 to-gray-800 tracking-tight truncate max-w-[120px] sm:max-w-none">
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
                                    user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN'
                                        ? '/admin/dashboard'
                                        : user.role === 'STUDENT' && user.name
                                            ? `/${user.orgSlug}/${user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`
                                            : `/${user.orgSlug}/dashboard`
                                }
                                className="flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2.5 rounded-sm transition-all duration-300 font-medium shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-100"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center p-1 rounded-sm bg-gray-50/50">
                        <Link
                            href="/login"
                            className={`flex items-center mr-1 md:mr-2 space-x-2 px-3 py-2 md:px-5 md:py-2.5 rounded-sm transition-all duration-300 font-medium text-xs md:text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${pathname === '/login'
                                ? 'bg-white text-indigo-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                                }`}
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Login</span>
                        </Link>
                        <Link
                            href="/register"
                            className={`flex items-center space-x-2 px-3 py-2 md:px-5 md:py-2.5 rounded-sm transition-all duration-300 font-medium text-xs md:text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${pathname === '/register'
                                ? 'bg-white text-indigo-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
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
