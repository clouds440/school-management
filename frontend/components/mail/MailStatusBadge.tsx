'use client';

import React from 'react';
import { MailStatus } from '@/types';

const STATUS_CONFIG: Record<MailStatus, { label: string; bg: string; text: string; border: string }> = {
    [MailStatus.OPEN]: { label: 'Open', bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
    [MailStatus.IN_PROGRESS]: { label: 'In Progress', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
    [MailStatus.AWAITING_RESPONSE]: { label: 'Awaiting', bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20' },
    [MailStatus.RESOLVED]: { label: 'Resolved', bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20' },
    [MailStatus.CLOSED]: { label: 'Closed', bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20' },
    [MailStatus.NO_REPLY]: { label: 'Notice (No Reply)', bg: 'bg-neutral-500/10', text: 'text-neutral-600', border: 'border-neutral-500/20' },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    LOW: { label: 'Low', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
    NORMAL: { label: 'Normal', bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-100' },
    HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    URGENT: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
};

interface StatusBadgeProps {
    status: MailStatus;
    className?: string;
}

export function MailStatusBadge({ status, className = '' }: StatusBadgeProps) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG[MailStatus.OPEN];
    return (
        <span className={`inline-flex items-center justify-center px-2 py-0.75 rounded-full text-[10px] uppercase font-black tracking-widest border leading-none ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}>
            {cfg.label}
        </span>
    );
}

interface PriorityBadgeProps {
    priority: string;
    className?: string;
}

export function MailPriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
    const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.NORMAL;
    return (
        <span className={`inline-flex items-center justify-center px-2 py-0.75 rounded-full text-[10px] uppercase font-black tracking-widest border leading-none ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}>
            {cfg.label}
        </span>
    );
}

export function getMailRowClassName(status: MailStatus) {
    switch (status) {
        case MailStatus.OPEN:
            return '!bg-blue-50/40 border-l-4 border-l-blue-500 shadow-sm transition-colors';
        case MailStatus.IN_PROGRESS:
            return '!bg-amber-50/40 border-l-4 border-l-amber-400 transition-colors';
        case MailStatus.AWAITING_RESPONSE:
            return '!bg-indigo-50/40 border-l-4 border-l-indigo-400 transition-colors';
        case MailStatus.RESOLVED:
            return '!bg-emerald-50/40 border-l-4 border-l-emerald-500 transition-colors';
        case MailStatus.CLOSED:
            return '!bg-slate-50/40 border-l-4 border-l-slate-400 opacity-80 transition-colors';
        default:
            return 'transition-colors hover:bg-gray-50/50';
    }
}
