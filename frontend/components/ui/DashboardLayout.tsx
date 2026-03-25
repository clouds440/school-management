'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut, X, Key, LifeBuoy, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { Role } from '@/types';
import { BackButton } from './BackButton';
import { DataViewModal } from './DataViewModal';
import { getPublicUrl } from '@/lib/utils';

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
    brandHref?: string;
}

export function DashboardLayout({ children, links, bottomLinks = [], title = 'Dashboard', brandHref }: DashboardLayoutProps) {
    const { logout, user } = useAuth();
    const { isExpanded, isMobileOpen, toggleSidebar, setIsMobileOpen, modalConfig, closeViewModal } = useUI();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const activeLink = React.useMemo(() => {
        const allLinks = [...links, ...bottomLinks];
        const query = searchParams.toString();
        const fullPath = query ? `${pathname}?${query}` : pathname;

        // 1. Try exact match first
        const exactMatch = allLinks.find(l => l.href === fullPath);
        if (exactMatch) return exactMatch;

        // 2. Intelligent Tab/Query Match (ignores extra params like sectionId)
        const currentTab = searchParams.get('tab') || 'overview';
        const tabMatch = allLinks.find(l => {
            const isTabLink = l.href.includes('tab=');
            if (isTabLink) {
                const linkUrlPart = l.href.split('?')[1] || '';
                const linkTab = new URLSearchParams(linkUrlPart).get('tab');
                return linkTab === currentTab && l.href.split('?')[0] === pathname;
            }
            return currentTab === 'overview' && l.href === pathname;
        });

        if (tabMatch) return tabMatch;

        // 4. Try sub-path matches
        // Exclude query-based links here to avoid false positive subpath matches
        return allLinks
            .filter(l => !l.href.endsWith('/dashboard') && !l.href.endsWith('/admin') && !l.href.includes('?'))
            .sort((a, b) => (b.href?.length || 0) - (a.href?.length || 0))
            .find(l => pathname.startsWith(`${l.href}/`));
    }, [pathname, searchParams, links, bottomLinks]);

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="flex w-full bg-theme-bg h-full overflow-hidden relative select-none">
            {/* Global View Modal */}
            <DataViewModal
                isOpen={modalConfig.isOpen}
                onClose={closeViewModal}
                title={modalConfig.title}
                subtitle={modalConfig.subtitle}
                fields={modalConfig.fields}
                actions={modalConfig.actions}
            />

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-80 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Branded Sidebar */}
            <aside
                className={`
                    fixed lg:relative inset-y-0 left-0 z-90 transform transition-all duration-300 ease-in-out
                    flex flex-col bg-sidebar text-sidebar-text border-r border-sidebar-text/10 shadow-[4px_0_24px_var(--shadow-color)]
                    ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
                    ${isExpanded ? 'lg:w-72' : 'lg:w-20'}
                    h-full shrink-0 overflow-hidden
                `}
            >
                {/* Sidebar Header - Branded */}
                <div className={`h-16 flex items-center px-6 border-b border-sidebar-text/10 bg-sidebar-text/5 shrink-0 ${!isExpanded ? 'justify-center' : 'justify-between'}`}>
                    {isExpanded && (
                        <Link
                            href={brandHref || '#'}
                            className="font-black text-lg text-sidebar-text truncate transition-all animate-in fade-in duration-300 hover:text-primary-hover"
                        >
                            Dashboard
                        </Link>
                    )}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-2 text-sidebar-text opacity-70 hover:opacity-100 rounded-sm transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Floating Toggle Button - Desktop */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSidebar();
                        }}
                        className={`hidden lg:flex absolute ${isExpanded ? 'right-3' : 'right-5'} top-4 p-3 rounded-sm cursor-pointer bg-primary text-primary-text hover:bg-primary-hover shadow-lg transition-all z-100 hover:scale-110 active:scale-90 border-2 border-white/20`}
                        title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>

                {/* Branded Sidebar Links */}
                <div className="flex-1 overflow-y-auto scrollbar-none py-6 px-3 space-y-1.5">
                    {links.map((link) => {
                        const isActive = activeLink?.id === link.id;
                        return (
                            <Link
                                key={link.id}
                                href={link.href}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsMobileOpen(false);
                                    router.push(link.href);
                                }}
                                className={`
                                    flex items-center rounded-sm transition-all group relative
                                    ${isActive
                                        ? 'bg-sidebar-active text-sidebar-active-text shadow-[0_8px_16px_var(--shadow-color)]'
                                        : 'text-sidebar-text/70 hover:bg-sidebar-text/10 hover:text-sidebar-text'
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
                                    <span className={`ml-auto ${isActive ? 'bg-sidebar-active-text/20' : 'bg-sidebar-text/10'} px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter text-sidebar-text`}>
                                        {link.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Branded Sidebar Footer */}
                <div className="p-4 border-t border-sidebar-text/10 bg-sidebar-text/5 shrink-0">
                    {user && (
                        <div className={`flex items-center ${!isExpanded ? 'lg:justify-center' : 'mb-4 space-x-3 px-1'} mb-4`}>
                            <div className={`w-9 h-9 rounded-sm ${user.avatarUrl || user.orgLogoUrl ? 'bg-transparent' : 'bg-primary'} flex items-center justify-center text-sidebar-active-text font-bold shrink-0 shadow-inner overflow-hidden relative`}>
                                {user.avatarUrl || user.orgLogoUrl ? (
                                    <Image
                                        src={getPublicUrl(user.avatarUrl || user.orgLogoUrl, user.avatarUpdatedAt)}
                                        alt={user.name!}
                                        fill
                                        className="object-cover rounded-full"
                                        unoptimized
                                    />
                                ) : (
                                    <UserIcon className="w-5 h-5" />
                                )}
                            </div>
                            <div className={`overflow-hidden transition-all ${!isExpanded ? 'lg:hidden lg:w-0' : 'w-auto'}`}>
                                <div className="text-xs font-black text-sidebar-text truncate max-w-[120px]">{user.name || user.email}</div>
                                <div className="text-[9px] font-bold text-sidebar-text/60 uppercase tracking-tighter leading-none mt-0.5">{user.designation || user.role?.replace('_', ' ')}</div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {user?.orgSlug && (
                            <Link
                                href="/support"
                                onClick={(e) => {
                                    e.preventDefault();
                                    router.push('/support');
                                }}
                                className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-start px-3'} rounded-sm text-sidebar-text/60 hover:bg-sidebar-text/10 transition-all py-2 border border-transparent shadow-sm`}
                                title="Help & Support"
                            >
                                <LifeBuoy className="w-4 h-4 shrink-0" />
                                {isExpanded && <span className="ml-2 font-bold text-[10px] uppercase tracking-wider">Support</span>}
                            </Link>
                        )}
                        <Link
                            href={user?.role === Role.SUPER_ADMIN || user?.role === Role.PLATFORM_ADMIN ? '/admin/change-password' : `/${user?.orgSlug}/change-password`}
                            onClick={(e) => {
                                e.preventDefault();
                                router.push(user?.role === Role.SUPER_ADMIN || user?.role === Role.PLATFORM_ADMIN ? '/admin/change-password' : `/${user?.orgSlug}/change-password`);
                            }}
                            className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-start px-3'} rounded-sm text-sidebar-text/60 hover:bg-sidebar-text/10 transition-all py-2 border border-transparent shadow-sm`}
                            title="Security"
                        >
                            <Key className="w-4 h-4 shrink-0" />
                            {isExpanded && <span className="ml-2 font-bold text-[10px] uppercase tracking-wider">Security</span>}
                        </Link>

                        <button
                            onClick={handleLogout}
                            className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-start px-3'} w-full rounded-sm text-red-500 hover:bg-red-500/10 transition-all py-2 border border-transparent shadow-sm`}
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
                {/* Branded Navbar */}
                <header className="h-16 border-b border-black/5 bg-navbar text-navbar-text flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm relative z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileOpen(true)}
                            className="lg:hidden p-2 hover:bg-white/10 rounded-sm transition-colors"
                        >
                            <ChevronRight className="w-6 h-6 rotate-180" />
                        </button>

                        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            {pathname !== '/admin/dashboard' &&
                                !pathname.endsWith('/admin') && (
                                    <BackButton />
                                )}
                            <div className="flex items-center gap-3">
                                {activeLink && activeLink.icon && (
                                    <div className="p-2 bg-primary/10 rounded-sm text-white">
                                        <activeLink.icon className="w-5 h-5" />
                                    </div>
                                )}
                                <h2 className="text-xl font-black tracking-tight uppercase truncate max-w-[200px] md:max-w-none">
                                    {activeLink?.label}
                                </h2>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Universal Content Wrapper - This is the ONLY scrollable area */}
                <div className="flex-1 w-full px-[3px] md:px-2 py-2 md:py-4 overflow-y-auto bg-slate-300">
                    {children}
                </div>
            </main>
        </div>
    );
}
