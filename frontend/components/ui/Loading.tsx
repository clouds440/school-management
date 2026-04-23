'use client';

import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

interface LoadingProps {
    text?: string;
    icon?: LucideIcon;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    fullScreen?: boolean;
}

const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
};

const textSizeMap = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
};

export function Loading({ 
    text, 
    icon: Icon, 
    className = '', 
    size = 'md',
    fullScreen = false
}: LoadingProps) {
    const containerClasses = fullScreen 
        ? `fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl ${className}`
        : `flex flex-col items-center justify-center py-12 ${className}`;

    const spinnerSize = sizeMap[size];
    const textSize = textSizeMap[size];

    return (
        <div className={containerClasses}>
            <div className="relative">
                {/* Background pulse */}
                <div className={`absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150 blur-xl ${spinnerSize}`} />
                
                {/* Main Spinner/Icon */}
                <div className="relative bg-linear-to-br from-card/80 to-card/60 backdrop-blur-xl p-3 md:p-4 rounded-2xl shadow-xl border border-border/50 flex items-center justify-center">
                    {Icon ? (
                        <div className="relative">
                            <Icon className={`${spinnerSize} text-primary animate-pulse`} />
                            <Loader2 className={`absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 text-primary/60 animate-spin`} />
                        </div>
                    ) : (
                        <Loader2 className={`${spinnerSize} text-primary animate-spin`} />
                    )}
                </div>
            </div>
            
            {text && (
                <p className={`mt-4 md:mt-6 font-semibold tracking-[0.2em] text-foreground/70 animate-pulse ${textSize}`}>
                    {text}
                </p>
            )}
        </div>
    );
}
