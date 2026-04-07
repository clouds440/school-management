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
    xs: 'w-3 h-3',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
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
        ? `fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md ${className}`
        : `flex flex-col items-center justify-center py-12 ${className}`;

    const spinnerSize = sizeMap[size];
    const textSize = textSizeMap[size];

    return (
        <div className={containerClasses}>
            <div className="relative">
                {/* Background pulse */}
                <div className={`absolute inset-0 bg-primary/10 rounded-full animate-ping scale-150 ${spinnerSize}`} />
                
                {/* Main Spinner/Icon */}
                <div className="relative bg-card p-2 rounded-full shadow-sm border border-border flex items-center justify-center">
                    {Icon ? (
                        <div className="relative">
                            <Icon className={`${spinnerSize} text-primary animate-pulse`} />
                            <Loader2 className={`absolute -top-1 -right-1 w-4 h-4 text-primary/60 animate-spin`} />
                        </div>
                    ) : (
                        <Loader2 className={`${spinnerSize} text-primary animate-spin`} />
                    )}
                </div>
            </div>
            
            {text && (
                <p className={`mt-4 font-black uppercase tracking-[0.2em] text-foreground/60 animate-pulse ${textSize}`}>
                    {text}
                </p>
            )}
        </div>
    );
}
