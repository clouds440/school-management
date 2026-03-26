'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export function ClientFooter() {
    const pathname = usePathname();

    // Only show footer on home page and mail page
    const showFooter = pathname === '/' || pathname?.includes('/mail');

    if (!showFooter) return null;

    return <Footer />;
}
