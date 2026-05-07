'use client';

import React, { useMemo } from 'react';
import zxcvbn from 'zxcvbn';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
    password?: string;
    className?: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '', className }) => {
    const result = useMemo(() => zxcvbn(password), [password]);

    if (!password) return null;

    const score = result.score; // 0 to 4

    const getStrengthColor = (s: number) => {
        switch (s) {
            case 0: return 'bg-red-500';
            case 1: return 'bg-orange-500';
            case 2: return 'bg-yellow-500';
            case 3: return 'bg-lime-500';
            case 4: return 'bg-green-500';
            default: return 'bg-muted';
        }
    };

    const getStrengthLabel = (s: number) => {
        switch (s) {
            case 0: return 'Very Weak';
            case 1: return 'Weak';
            case 2: return 'Fair';
            case 3: return 'Strong';
            case 4: return 'Very Strong';
            default: return '';
        }
    };

    return (
        <div className={cn("space-y-2 w-full animate-in fade-in slide-in-from-top-1 duration-300", className)}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                    Security Level
                </span>
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                    score === 0 ? "text-red-500" :
                    score === 1 ? "text-orange-500" :
                    score === 2 ? "text-yellow-500" :
                    score === 3 ? "text-lime-500" : "text-green-500"
                )}>
                    {getStrengthLabel(score)}
                </span>
            </div>
            
            <div className="flex gap-1 h-1">
                {[0, 1, 2, 3].map((step) => (
                    <div
                        key={step}
                        className={cn(
                            "flex-1 rounded-full transition-all duration-700",
                            step <= score - 1 ? getStrengthColor(score) : "bg-muted/20"
                        )}
                    />
                ))}
            </div>

            {result.feedback.warning && (
                <p className="text-[9px] font-bold text-red-500/80 leading-tight">
                    ⚠ {result.feedback.warning}
                </p>
            )}
            
            {result.feedback.suggestions.length > 0 && score < 3 && (
                <ul className="space-y-1">
                    {result.feedback.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-[9px] font-medium text-muted-foreground/60 leading-tight">
                            • {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PasswordStrength;
