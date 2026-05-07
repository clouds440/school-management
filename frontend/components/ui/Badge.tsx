import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'error' | 'warning' | 'neutral' | 'primary' | 'secondary' | 'info' | 'purple';
type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    title?: string;
    size?: BadgeSize;
    className?: string;
    /** Optional dot indicator */
    dot?: boolean;
    /** Optional icon on the left */
    icon?: React.ElementType;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-600",
    error: "bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-600",
    warning: "bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-600",
    neutral: "bg-slate-200 text-slate-700 dark:bg-slate-600/30 dark:text-slate-600",
    primary: "bg-indigo-600 text-white dark:bg-indigo-500",
    secondary: "bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-600",
    info: "bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-600",
    purple: "bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-600",
};

const dotColors: Record<BadgeVariant, string> = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    warning: "bg-amber-600",
    neutral: "bg-slate-600",
    primary: "bg-white",
    secondary: "bg-indigo-600",
    info: "bg-blue-600",
    purple: "bg-purple-600",
};

const sizeStyles: Record<BadgeSize, string> = {
    xs: "h-3 px-1 text-[10px] gap-1",
    sm: "h-5 px-1.5 text-[11px] gap-1",
    md: "h-6 px-2 text-[12px] gap-1.5",
};

export function Badge({
    children,
    variant = 'neutral',
    title,
    size = 'md',
    className,
    dot,
    icon: Icon,
}: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center justify-center font-medium whitespace-nowrap",
                "rounded-md select-none shrink-0",
                sizeStyles[size],
                variantStyles[variant],
                className,
            )}
            title={title}
        >
            {dot && (
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
            )}
            {Icon && (
                <Icon className="w-3.5 h-3.5 shrink-0" />
            )}
            {children}
        </span>
    );
}
