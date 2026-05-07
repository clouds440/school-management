'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from './Button';

interface BackButtonProps {
    showHome?: boolean;
    label?: string;
    className?: string;
    homeClasses?: string;
}

export function BackButton({
    showHome = false,
    label = "Back",
    className = "",
    homeClasses = ""
}: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.push('/');
    };

    return (
        <div className="flex items-center gap-1">
            <Button
                onClick={handleBack}
                className={className}
                icon={ArrowLeft}
                variant="secondary"
                title="Go back to previous page"
            >
                {label && <span>{label}</span>}
            </Button>

            {showHome && (
                <Button
                    onClick={handleHome}
                    title="Go to home page"
                    icon={Home}
                    className={homeClasses}
                >
                </Button>
            )}
        </div>
    );
}