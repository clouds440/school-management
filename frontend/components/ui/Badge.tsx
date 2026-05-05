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
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    primary: "bg-indigo-600 text-white dark:bg-indigo-500",
    secondary: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const dotColors: Record<BadgeVariant, string> = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    warning: "bg-amber-500",
    neutral: "bg-slate-400",
    primary: "bg-white",
    secondary: "bg-indigo-500",
    info: "bg-blue-500",
    purple: "bg-purple-500",
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
