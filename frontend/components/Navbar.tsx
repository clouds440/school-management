'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, UserPlus, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useGlobal } from '@/context/GlobalContext';
import { Brand } from './ui/Brand';
import { NotificationDropdown } from './notifications/NotificationDropdown';
import { AnnouncementDropdown } from './announcements/AnnouncementDropdown';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ThemeMode } from '@/types';


export default function Navbar() {
    const { token, user } = useAuth();
    const { toggleMobileSidebar, toggleSidebar, isMobileOpen, isExpanded, isDesktop, mounted } = useUI();
    const { state } = useGlobal();
    const pathname = usePathname();
    const { themeMode, setThemeMode } = useTheme();
    const chatUnread = state.stats.chat?.unread || 0;

    const isDashboard = pathname?.startsWith('/admin/') ||
        pathname?.split('/').length > 2; // Matches /something/deep OR /admin/something

    return (
        <nav className="fixed top-0 left-0 right-0 z-100 flex items-center justify-between pl-2 pr-4 py-3 md:pr-10 backdrop-blur-xl bg-navbar border-b border-border shadow-sm h-16 transition-all duration-300 text-navbar-foreground">
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
                        className="relative p-2 hover:bg-accent rounded-sm transition-colors text-muted-foreground outline-none focus-visible:ring-2 ring-primary"
                        title={mounted ? (isDesktop ? (isExpanded ? "Collapse Sidebar" : "Expand Sidebar") : (isMobileOpen ? "Close Menu" : "Open Menu")) : "Menu"}
                    >
                        {isDesktop ? (<Menu className="w-6 h-6" />) : (isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />)}
                        {!isDesktop && !isMobileOpen && chatUnread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black shadow-sm">
                                {chatUnread > 99 ? '99+' : chatUnread}
                            </span>
                        )}
                    </button>
                )}
                <Brand size="md" showName={isDesktop} />
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
                {token && user ? (
                    <div className="flex items-center space-x-1 md:space-x-3 pr-2">
                        <button
                            onClick={() => {
                                // cycle: system -> dark -> light -> system
                                const next = themeMode === ThemeMode.SYSTEM ? ThemeMode.DARK : (themeMode === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.SYSTEM);
                                setThemeMode(next).catch(() => { /* swallow */ });
                            }}
                            title={`Theme: ${themeMode}`}
                            className="p-2 hover:bg-primary/10 rounded-full transition-colors text-primary/80 hover:text-primary outline-none focus-visible:ring-2 ring-primary"
                        >
                            {themeMode === ThemeMode.LIGHT && <Sun className="w-5 h-5" />}
                            {themeMode === ThemeMode.DARK && <Moon className="w-5 h-5" />}
                            {themeMode === ThemeMode.SYSTEM && <Monitor className="w-5 h-5" />}
                        </button>
                        <AnnouncementDropdown />
                        <NotificationDropdown />
                    </div>
                ) : (
                    <div className="flex items-center p-1 rounded-sm bg-secondary/20 shadow-inner border border-secondary/10">
                        <Link
                            href="/login"
                            className={`flex items-center mr-1 md:mr-2 space-x-2 px-3 py-2 md:px-5 md:py-2.5 rounded-sm transition-all duration-300 font-medium text-xs md:text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary ${pathname === '/login'
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'text-foreground hover:text-primary hover:bg-card'
                                }`}
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Login</span>
                        </Link>
                        <Link
                            href="/register"
                            className={`flex items-center space-x-2 px-3 py-2 md:px-5 md:py-2.5 rounded-sm transition-all duration-300 font-medium text-xs md:text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary ${pathname === '/register'
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'text-foreground hover:text-primary hover:bg-card'
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
