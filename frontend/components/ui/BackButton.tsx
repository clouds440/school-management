'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';

interface BackButtonProps {
    showHome?: boolean;
    label?: string;
    className?: string;
}

export function BackButton({
    showHome = false,
    label = "Back",
    className = ""
}: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.push('/');
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleBack}
                className={`
                    group flex items-center gap-2 text-sm font-medium 
                    text-gray-700 dark:text-gray-200 
                    transition-all duration-200 
                    bg-white/20 hover:bg-white/40 
                    dark:bg-gray-800/30 dark:hover:bg-gray-800/50 
                    backdrop-blur-md 
                    border border-white/10 dark:border-gray-700/40 
                    rounded-sm py-2.5 px-4 
                    shadow-lg hover:shadow-xl 
                    hover:-translate-y-0.5 active:scale-95 cursor-pointer
                    ${className}
                `}
                aria-label="Go back to previous page"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                {label && <span>{label}</span>}
            </button>

            {showHome && (
                <button
                    onClick={handleHome}
                    className="group flex items-center justify-center text-gray-600 dark:text-gray-300 bg-white/30 hover:bg-white/50 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 backdrop-blur-md border border-white/40 dark:border-gray-700/40 rounded-sm p-2.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                    aria-label="Go to home page"
                >
                    <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                </button>
            )}
        </div>
    );
}