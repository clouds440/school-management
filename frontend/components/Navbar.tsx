'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { School, LogIn, UserPlus, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const { token, user, logout } = useAuth();
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className="relative z-50 flex items-center justify-between px-6 py-4 md:px-10 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] w-full transition-all duration-300">
            <Link href="/" className="flex items-center space-x-3 group outline-none">
                <div className="bg-indigo-50 p-2.5 rounded-2xl group-hover:bg-indigo-100 group-hover:scale-105 group-focus-visible:ring-2 ring-indigo-500 transition-all duration-300">
                    <School className="w-7 h-7 text-indigo-600" />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-800 tracking-tight">
                    EduManage
                </span>
            </Link>
            <div className="flex items-center space-x-3 md:space-x-4">
                {token && user ? (
                    <div className="flex items-center space-x-2">
                        {!pathname.endsWith('/dashboard') && (
                            <Link
                                href={user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : `/${user.orgSlug}/dashboard`}
                                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-100"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-gray-100 text-red-600 hover:bg-red-50 hover:border-red-100 transition-all duration-300 font-medium shadow-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center p-1.5 rounded-2xl">
                        <Link
                            href="/login"
                            className={`flex items-center mr-2 space-x-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${pathname === '/login'
                                ? 'bg-white text-gray-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                : 'text-gray-600 bg-gray-200 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Login</span>
                        </Link>
                        <Link
                            href="/register"
                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${pathname === '/register'
                                ? 'bg-white text-gray-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                : 'text-gray-600 bg-gray-200 hover:text-gray-900 hover:bg-gray-100'
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
