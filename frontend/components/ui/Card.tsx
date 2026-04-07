'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    accentColor?: string; // Tailwind color class, e.g., 'bg-primary'
    hoverable?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    animate?: boolean;
    delay?: number; // delay in ms
}

export const Card = ({
    children,
    onClick,
    className,
    accentColor = 'bg-primary',
    hoverable = true,
    padding = 'md',
    animate = true,
    delay = 0,
}: CardProps) => {
    const paddingClasses = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-7',
        xl: 'p-8',
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-card/80 backdrop-blur-sm border border-border rounded-2xl flex flex-col h-full relative overflow-hidden ring-1 ring-border transition-all duration-500",
                paddingClasses[padding],
                hoverable && "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:z-10 group",
                onClick && "cursor-pointer",
                animate && "opacity-0 animate-fade-in-up-subtle",
                className
            )}
            style={animate ? { animationDelay: `${delay}ms` } : undefined}
        >
            {/* Premium Accent Line */}
            {accentColor && (
                <div className="absolute top-0 left-0 w-full h-[6px] group-hover:bg-primary/10 transition-colors">
                    <div className={cn(
                        "h-full w-0 group-hover:w-full transition-all duration-700 ease-out fill-mode-forwards",
                        accentColor
                    )} />
                </div>
            )}
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("mb-6 pt-2 flex justify-between items-start", className)}>
        {children}
    </div>
);

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("flex-1 space-y-4", className)}>
        {children}
    </div>
);

export const CardFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("mt-8 pt-6 border-t border-border flex items-center justify-between", className)}>
        {children}
    </div>
);
