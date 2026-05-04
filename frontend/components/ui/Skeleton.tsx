import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    /** Width — accepts any CSS value */
    width?: string;
    /** Height — accepts any CSS value */
    height?: string;
}

/**
 * Base shimmer skeleton — use directly or via preset components below.
 */
export function Skeleton({ className, width, height }: SkeletonProps) {
    return (
        <div
            className={cn(
                "rounded-md bg-(--muted-bg)",
                "animate-pulse",
                className,
            )}
            style={{ width, height }}
            aria-hidden="true"
        />
    );
}

/* ── Preset Variants ──────────────────────────────────────────────── */

/** Circular skeleton for avatars */
export function SkeletonAvatar({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
    const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
    return <Skeleton className={cn("rounded-full shrink-0", sizeMap[size], className)} />;
}

/** Single line of text */
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="h-4"
                    width={i === lines - 1 && lines > 1 ? '60%' : '100%'}
                />
            ))}
        </div>
    );
}

/** Card-shaped skeleton */
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn(
            "rounded-lg border border-(--border-color) p-5 space-y-4",
            className,
        )}>
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-3 pt-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
            </div>
        </div>
    );
}

/** Table row skeleton */
export function SkeletonTableRow({ columns = 4, className }: { columns?: number; className?: string }) {
    return (
        <div className={cn("flex items-center gap-4 h-16 px-4", className)}>
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="h-4 flex-1"
                    width={i === 0 ? '40%' : undefined}
                />
            ))}
        </div>
    );
}

/** Multiple table rows */
export function SkeletonTable({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
    return (
        <div className={cn("divide-y divide-(--border-color) border border-(--border-color) rounded-md", className)}>
            {/* Header */}
            <div className="flex items-center gap-4 h-12 px-4 bg-(--muted-bg)/50">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-3 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonTableRow key={i} columns={columns} />
            ))}
        </div>
    );
}
