'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="group flex items-center space-x-2 text-sm font-bold text-white transition-all w-fit bg-black/10 hover:bg-black/20 backdrop-blur-md border border-white/20 rounded-sm py-2.5 px-6 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
        >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform duration-300" />
            <span>Back to Previous</span>
        </button>
    );
}
