'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, UserPlus, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { Brand } from './ui/Brand';
import { NotificationDropdown } from './notifications/NotificationDropdown';
import { AnnouncementDropdown } from './announcements/AnnouncementDropdown';
import { ChatDropdown } from './chat/ChatDropdown';
import { useGlobal } from '@/context/GlobalContext';


export default function Navbar() {
    const { token, user } = useAuth();
    const { toggleMobileSidebar, toggleSidebar, isMobileOpen, isExpanded, isDesktop, mounted } = useUI();
    const pathname = usePathname();
    const { state } = useGlobal();
    const orgData = state.stats.orgData;
    const isApproved = !user?.orgSlug || orgData?.status === 'APPROVED';

    const isDashboard = pathname?.startsWith('/admin/') ||
        pathname?.split('/').length > 2; // Matches /[orgSlug]/something OR /admin/something

    return (
        <nav className="fixed top-0 left-0 right-0 z-100 flex items-center justify-between pl-2 pr-4 py-3 md:pr-10 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] h-16 transition-all duration-300">
            <div className="flex space-x-2">
                {isDashboard && (
                    <button
                        onClick={() => {
                            if (isDesktop) {
                                toggleSidebar();
                            } else {
                                toggleMobileSidebar();
                            }
                        }}
                        className="p-2 hover:bg-gray-100 rounded-sm transition-colors text-gray-600 outline-none focus-visible:ring-2 ring-primary"
                        title={mounted ? (isDesktop ? (isExpanded ? "Collapse Sidebar" : "Expand Sidebar") : (isMobileOpen ? "Close Menu" : "Open Menu")) : "Menu"}
                    >
                        {isDesktop ? (<Menu className="w-6 h-6" />) : (isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />)}
                    </button>
                )}
                <Brand size="md" />
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
                {token && user ? (
                    <div className="flex items-center space-x-1 md:space-x-3 pr-2">
                        <AnnouncementDropdown />
                        {isApproved && <ChatDropdown />}
                        <NotificationDropdown />
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
