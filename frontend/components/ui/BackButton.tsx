'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="group flex items-center space-x-2 text-sm font-medium text-indigo-100 hover:text-white transition-all w-fit bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full py-1.5 px-4 shadow-sm"
        >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
        </button>
    );
}
