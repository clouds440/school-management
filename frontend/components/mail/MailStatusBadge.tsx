'use client';

import { MailStatus, ThemeMode } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/context/ThemeContext';

const STATUS_CONFIG: Record<MailStatus, { label: string; variant: 'info' | 'warning' | 'purple' | 'success' | 'neutral' }> = {
    [MailStatus.OPEN]: { label: 'Open', variant: 'info' },
    [MailStatus.IN_PROGRESS]: { label: 'In Progress', variant: 'warning' },
    [MailStatus.AWAITING_RESPONSE]: { label: 'Awaiting', variant: 'purple' },
    [MailStatus.RESOLVED]: { label: 'Resolved', variant: 'success' },
    [MailStatus.CLOSED]: { label: 'Closed', variant: 'neutral' },
    [MailStatus.NO_REPLY]: { label: 'Notice (No Reply)', variant: 'neutral' },
};

const PRIORITY_CONFIG: Record<string, { label: string; variant: 'neutral' | 'info' | 'warning' | 'error' }> = {
    LOW: { label: 'Low', variant: 'neutral' },
    NORMAL: { label: 'Normal', variant: 'info' },
    HIGH: { label: 'High', variant: 'warning' },
    URGENT: { label: 'Urgent', variant: 'error' },
};

interface StatusBadgeProps {
    status: MailStatus;
    className?: string;
}

export function MailStatusBadge({ status, className = '' }: StatusBadgeProps) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG[MailStatus.OPEN];
    return (
        <Badge variant={cfg.variant} className={className} size="sm">
            {cfg.label}
        </Badge>
    );
}

interface PriorityBadgeProps {
    priority: string;
    className?: string;
}

export function MailPriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
    const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.NORMAL;
    return (
        <Badge variant={cfg.variant} className={className} size="sm">
            {cfg.label}
        </Badge>
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
