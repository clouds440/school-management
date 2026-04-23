'use client';

import { MailStatus, ThemeMode } from '@/types';
import { useTheme } from '@/context/ThemeContext';

const STATUS_CONFIG_LIGHT: Record<MailStatus, { label: string; bg: string; text: string; border: string }> = {
    [MailStatus.OPEN]: { label: 'Open', bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/50' },
    [MailStatus.IN_PROGRESS]: { label: 'In Progress', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/50' },
    [MailStatus.AWAITING_RESPONSE]: { label: 'Awaiting', bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/50' },
    [MailStatus.RESOLVED]: { label: 'Resolved', bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/50' },
    [MailStatus.CLOSED]: { label: 'Closed', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
    [MailStatus.NO_REPLY]: { label: 'Notice (No Reply)', bg: 'bg-neutral-500/10', text: 'text-neutral-600', border: 'border-neutral-500/50' },
};

const STATUS_CONFIG_DARK: Record<MailStatus, { label: string; bg: string; text: string; border: string }> = {
    [MailStatus.OPEN]: { label: 'Open', bg: 'bg-blue-950/30', text: 'text-blue-400', border: 'border-blue-500/30' },
    [MailStatus.IN_PROGRESS]: { label: 'In Progress', bg: 'bg-amber-950/30', text: 'text-amber-400', border: 'border-amber-500/30' },
    [MailStatus.AWAITING_RESPONSE]: { label: 'Awaiting', bg: 'bg-purple-950/30', text: 'text-purple-400', border: 'border-purple-500/30' },
    [MailStatus.RESOLVED]: { label: 'Resolved', bg: 'bg-emerald-950/30', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    [MailStatus.CLOSED]: { label: 'Closed', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
    [MailStatus.NO_REPLY]: { label: 'Notice (No Reply)', bg: 'bg-neutral-800/30', text: 'text-neutral-400', border: 'border-neutral-500/30' },
};

const PRIORITY_CONFIG_LIGHT: Record<string, { label: string; bg: string; text: string; border: string }> = {
    LOW: { label: 'Low', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
    NORMAL: { label: 'Normal', bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-100' },
    HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    URGENT: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
};

const PRIORITY_CONFIG_DARK: Record<string, { label: string; bg: string; text: string; border: string }> = {
    LOW: { label: 'Low', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
    NORMAL: { label: 'Normal', bg: 'bg-blue-950/30', text: 'text-blue-400', border: 'border-blue-500/30' },
    HIGH: { label: 'High', bg: 'bg-orange-950/30', text: 'text-orange-400', border: 'border-orange-500/30' },
    URGENT: { label: 'Urgent', bg: 'bg-red-950/30', text: 'text-red-400', border: 'border-red-500/30' },
};

interface StatusBadgeProps {
    status: MailStatus;
    className?: string;
}

export function MailStatusBadge({ status, className = '' }: StatusBadgeProps) {
    const { themeMode } = useTheme();
    const isDark = themeMode === ThemeMode.DARK || (themeMode === ThemeMode.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const config = isDark ? STATUS_CONFIG_DARK : STATUS_CONFIG_LIGHT;
    const cfg = config[status] || config[MailStatus.OPEN];
    return (
        <span className={`inline-flex items-center justify-center px-2 py-0.75 rounded-full text-[10px] font-black tracking-widest border leading-none ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}>
            {cfg.label}
        </span>
    );
}

interface PriorityBadgeProps {
    priority: string;
    className?: string;
}

export function MailPriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
    const { themeMode } = useTheme();
    const isDark = themeMode === ThemeMode.DARK || (themeMode === ThemeMode.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const config = isDark ? PRIORITY_CONFIG_DARK : PRIORITY_CONFIG_LIGHT;
    const cfg = config[priority] || config.NORMAL;
    return (
        <span className={`inline-flex items-center justify-center px-2 py-0.75 rounded-full text-[10px] font-black tracking-widest border leading-none ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}>
            {cfg.label}
        </span>
    );
}

export function useMailRowClassName() {
    const { themeMode } = useTheme();

    return (status: MailStatus) => {
        const isDark = themeMode === ThemeMode.DARK || (themeMode === ThemeMode.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);

        switch (status) {
            case MailStatus.OPEN:
                return isDark
                    ? '!bg-blue-950/30 border-l-4 border-l-blue-500 shadow-sm transition-colors'
                    : '!bg-blue-200/50 border-l-4 border-l-blue-500 shadow-sm transition-colors';
            case MailStatus.IN_PROGRESS:
                return isDark
                    ? '!bg-amber-950/30 border-l-4 border-l-amber-400 transition-colors'
                    : '!bg-amber-200/50 border-l-4 border-l-amber-400 transition-colors';
            case MailStatus.AWAITING_RESPONSE:
                return isDark
                    ? '!bg-indigo-950/30 border-l-4 border-l-indigo-400 transition-colors'
                    : '!bg-indigo-200/50 border-l-4 border-l-indigo-400 transition-colors';
            case MailStatus.RESOLVED:
                return isDark
                    ? '!bg-emerald-950/30 border-l-4 border-l-emerald-500 transition-colors'
                    : '!bg-emerald-200/50 border-l-4 border-l-emerald-500 transition-colors';
            case MailStatus.CLOSED:
                return isDark
                    ? '!bg-slate-800/50 border-l-4 border-l-slate-400 opacity-80 transition-colors'
                    : '!bg-slate-200/50 border-l-4 border-l-slate-400 opacity-80 transition-colors';
            default:
                return 'transition-colors hover:bg-muted/40';
        }
    };
}
