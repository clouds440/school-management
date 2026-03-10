'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut, Menu, X, Key } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface SidebarLink {
    id: string;
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string | number;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    links: SidebarLink[];
    bottomLinks?: SidebarLink[];
    title?: string;
}

export function DashboardLayout({ children, links, bottomLinks = [], title = 'Dashboard' }: DashboardLayoutProps) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const router = useRouter();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex flex-1 w-full bg-gray-50/50 relative overflow-hidden h-full">
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar (Vertical Tabs) */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
                    flex flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
                    ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
                `}
            >
                {/* Sidebar Header */}
                <div className={`h-20 flex items-center px-4 md:px-6 border-b border-gray-100/50 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className={`font-black text-xl text-indigo-900 truncate transition-all ${isCollapsed ? 'hidden' : 'block'}`}>
                        {title}
                    </div>
                    {isCollapsed && (
                        <div className="hidden lg:flex w-full justify-center">
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                {title.charAt(0)}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100/50 transition-colors ml-auto"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Floating Collapse/Expand Button (Desktop) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex absolute -right-3 top-6 p-1 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 shadow-sm transition-colors z-[60]"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                {/* Sidebar Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 pb-24 scrollbar-none">
                    {links.map((link) => {
                        const isDashboardLink = link.href.endsWith('/dashboard');
                        const isActive = pathname === link.href || (!isDashboardLink && pathname.startsWith(`${link.href}/`));
                        return (
                            <Link
                                key={link.id}
                                href={link.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`
                                    flex items-center rounded-2xl transition-all group relative
                                    ${isActive
                                        ? 'bg-indigo-600 text-white shadow-[0_8px_16px_rgba(79,70,229,0.2)]'
                                        : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900'
                                    }
                                    ${isCollapsed ? 'lg:justify-center p-3' : 'px-4 py-3.5 space-x-3'}
                                `}
                                title={isCollapsed ? link.label : undefined}
                            >
                                <link.icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${isCollapsed ? '' : ''}`} />
                                <span className={`font-bold text-sm tracking-wide ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                                    {link.label}
                                </span>
                                {link.badge !== undefined && !isCollapsed && (
                                    <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter">
                                        {link.badge}
                                    </span>
                                )}
                                {link.badge !== undefined && isCollapsed && (
                                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white shadow-sm transition-transform group-hover:scale-110 z-10">
                                        {link.badge}
                                    </div>
                                )}
                                {isActive && !isCollapsed && link.badge === undefined && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/50" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Profile / Collapse Button */}
                <div className="p-4 border-t border-gray-100/50 bg-white/50 backdrop-blur-md absolute bottom-0 left-0 right-0">
                    {bottomLinks.map((link) => {
                        const isDashboardLink = link.href.endsWith('/dashboard');
                        const isActive = pathname === link.href || (!isDashboardLink && pathname.startsWith(`${link.href}/`));
                        return (
                            <Link
                                key={link.id}
                                href={link.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all py-2.5 mb-3 border border-gray-100 ${isCollapsed ? 'px-0' : 'px-3'} ${isActive ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : ''}`}
                                title={link.label}
                            >
                                <link.icon className="w-4 h-4 shrink-0" />
                                {!isCollapsed && <span className={`ml-2 font-bold text-xs uppercase tracking-wider ${isActive ? 'text-indigo-700' : ''}`}>{link.label}</span>}
                                {link.badge !== undefined && !isCollapsed && (
                                    <span className="ml-auto bg-white/50 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter">
                                        {link.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}

                    {user && (
                        <Link
                            href={user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN' ? '/admin/change-password' : `/${user.orgSlug}/change-password`}
                            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all py-2.5 mb-3 border border-gray-100 ${isCollapsed ? 'px-0' : 'px-3'}`}
                            title="Change Password"
                        >
                            <Key className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="ml-2 font-bold text-xs uppercase tracking-wider">Password</span>}
                        </Link>
                    )}
                    {user && (
                        <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'mb-4 space-x-3 px-2'} mb-4`}>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 shadow-inner">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className={`overflow-hidden transition-all ${isCollapsed ? 'lg:hidden lg:w-0' : 'w-auto'}`}>
                                <div className="text-sm font-black text-gray-900 truncate max-w-[140px]">{user.name || user.email}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user.role?.replace('_', ' ')}</div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleLogout}
                            title="Log out"
                            className={`flex items-center justify-center w-full rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all p-2.5`}
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="ml-2 font-bold text-sm">Log out</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto flex flex-col w-full h-full pb-20 md:pb-0">
                {/* Mobile Header */}
                <div className="lg:hidden h-20 flex items-center px-6 border-b border-gray-100/50 bg-white/80 backdrop-blur-md sticky top-0 z-30 justify-between">
                    <div className="font-black text-xl text-indigo-900">
                        {title}
                    </div>
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-xl text-gray-600 active:scale-95 transition-transform"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {children}
            </main>
        </div>
    );
}
