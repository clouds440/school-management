'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export function ClientFooter() {
    const pathname = usePathname();

    // Only show footer on home page and support page
    const showFooter = pathname === '/' || pathname === '/support';

    if (!showFooter) return null;

    return <Footer />;
}
