import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Standardizes image and file URLs by prepending the base API URL 
 * and handling fallbacks and cache-busting timestamps.
 */
export function getPublicUrl(path: string | null | undefined, updatedAt?: string | Date | null): string {
    if (!path) return '';

    // If it's already a full URL (http/https), return as is
    if (path.startsWith('http')) return path;

    // Get API URL from env and strip /api to get the base server URL
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL!).replace(/\/+$/, '');
    const baseUrl = apiUrl.replace(/\/api$/, '');

    // Ensure path starts with a slash if it doesn't already have one
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    let finalUrl = `${baseUrl}${normalizedPath}`;

    // Append timestamp for cache busting if provided (mostly for local files)
    if (updatedAt) {
        const date = new Date(updatedAt);
        if (!isNaN(date.getTime())) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + `t=${date.getTime()}`;
        }
    }

    return finalUrl;
}

export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
