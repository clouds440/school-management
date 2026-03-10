'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut, X, Key, LifeBuoy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';

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
    const { logout, user } = useAuth();
    const { isExpanded, isMobileOpen, toggleSidebar, setIsMobileOpen } = useUI();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex w-full bg-gray-50/50 h-full overflow-hidden relative">
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-80 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar (Vertical Tabs) */}
            <aside
                className={`
                    fixed lg:relative inset-y-0 left-0 z-90 transform transition-all duration-300 ease-in-out
                    flex flex-col bg-white border-r border-gray-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
                    ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
                    ${isExpanded ? 'lg:w-72' : 'lg:w-20'}
                    h-full shrink-0 overflow-hidden
                `}
            >
                {/* Sidebar Header */}
                <div className={`h-16 flex items-center px-6 border-b border-gray-100/50 shrink-0 ${!isExpanded ? 'justify-center' : 'justify-between'}`}>
                    {isExpanded && (
                        <div className="font-black text-lg text-indigo-900 truncate transition-all animate-in fade-in duration-300">
                            {title}
                        </div>
                    )}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-sm hover:bg-gray-100/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Floating Collapse/Expand Button (Desktop) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleSidebar();
                    }}
                    className={`hidden lg:flex absolute ${isExpanded ? 'right-3' : 'right-5'} top-4 p-3 rounded-sm cursor-pointer bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 shadow-md transition-all z-100 hover:scale-110 active:scale-90`}
                    title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    {isExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {/* Sidebar Links */}
                <div className="flex-1 overflow-y-auto scrollbar-none py-6 px-3 space-y-1.5">
                    {links.map((link) => {
                        const isDashboardLink = link.href.endsWith('/dashboard');
                        const isActive = pathname === link.href || (!isDashboardLink && pathname.startsWith(`${link.href}/`));
                        return (
                            <Link
                                key={link.id}
                                href={link.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`
                                    flex items-center rounded-sm transition-all group relative
                                    ${isActive
                                        ? 'bg-indigo-600 text-white shadow-[0_8px_16px_rgba(79,70,229,0.15)]'
                                        : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
                                    }
                                    ${!isExpanded ? 'lg:justify-center p-3' : 'px-4 py-3 space-x-3'}
                                `}
                                title={!isExpanded ? link.label : undefined}
                            >
                                <link.icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className={`font-bold text-sm tracking-wide ${!isExpanded ? 'lg:hidden' : 'block'}`}>
                                    {link.label}
                                </span>
                                {link.badge !== undefined && isExpanded && (
                                    <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter">
                                        {link.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Profile / Logout */}
                <div className="p-4 border-t border-gray-100/50 bg-gray-50/30 shrink-0">
                    {user && (
                        <div className={`flex items-center ${!isExpanded ? 'lg:justify-center' : 'mb-4 space-x-3 px-1'} mb-4`}>
                            <div className="w-9 h-9 rounded-sm bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 shadow-inner">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className={`overflow-hidden transition-all ${!isExpanded ? 'lg:hidden lg:w-0' : 'w-auto'}`}>
                                <div className="text-xs font-black text-gray-900 truncate max-w-[120px]">{user.name || user.email}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter leading-none mt-0.5">{user.role?.replace('_', ' ')}</div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {user?.orgSlug && (
                            <Link
                                href="/support"
                                className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-start px-3'} rounded-sm text-gray-500 hover:bg-gray-100 transition-all py-2 border border-transparent hover:border-gray-100 shadow-sm`}
                                title="Help & Support"
                            >
                                <LifeBuoy className="w-4 h-4 shrink-0" />
                                {isExpanded && <span className="ml-2 font-bold text-[10px] uppercase tracking-wider">Support</span>}
                            </Link>
                        )}
                        <Link
                            href={user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN' ? '/admin/change-password' : `/${user?.orgSlug}/change-password`}
                            className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-start px-3'} rounded-sm text-gray-500 hover:bg-gray-100 transition-all py-2 border border-transparent hover:border-gray-100 shadow-sm`}
                            title="Security"
                        >
                            <Key className="w-4 h-4 shrink-0" />
                            {isExpanded && <span className="ml-2 font-bold text-[10px] uppercase tracking-wider">Security</span>}
                        </Link>

                        <button
                            onClick={handleLogout}
                            className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-start px-3'} w-full rounded-sm text-red-500 hover:bg-red-50 transition-all py-2 border border-transparent hover:border-red-100 shadow-sm`}
                            title="Log out"
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            {isExpanded && <span className="ml-2 font-bold text-[10px] uppercase tracking-wider">Log out</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                {/* Universal Content Wrapper - This is the ONLY scrollable area */}
                <div className="flex-1 w-full px-[4px] md:px-1 py-4 md:py-6 overflow-y-auto animate-fade-in-up scrollbar-thin overflow-x-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
