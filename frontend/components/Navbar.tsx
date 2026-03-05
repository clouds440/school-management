'use client';

import Link from 'next/link';
import { School, LogIn, UserPlus, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const { token, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm w-full">
            <Link href="/" className="flex items-center space-x-2">
                <School className="w-8 h-8 text-indigo-600" />
                <span className="text-xl font-semibold text-gray-800">EduManage</span>
            </Link>
            <div className="flex items-center space-x-4">
                {token ? (
                    <>
                        <Link
                            href="/dashboard"
                            className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors shadow-sm cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            href="/login"
                            className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Login</span>
                        </Link>
                        <Link
                            href="/register"
                            className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Register</span>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
