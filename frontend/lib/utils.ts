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

    // Frontend static assets (like /assets/) should be returned as-is
    if (path.startsWith('/assets/')) return path;

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

// FNV-1a hash function for consistent color selection
const fnv1aHash = (str: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
};

/**
 * Get a consistent color for a user based on their ID
 * Uses HSL color space with distinct hues to ensure super distinct colors
 * and minimize the chance of collisions (theoretical max: 360 unique hues)
 */
export function getUserColor(userId: string | undefined | null): string {
    const seed = userId || 'anon';
    const hash = fnv1aHash(seed);

    // Use the hash to select a distinct hue (0-359)
    // We use modulo 360 to ensure we get a valid hue value
    const hue = hash % 360;

    // Use high saturation and lightness for vibrant, distinct colors
    // Saturation: 70-80% for vibrant colors
    // Lightness: 45-55% for good contrast on both light and dark backgrounds
    const saturation = 75 + (hash % 10); // 75-85%
    const lightness = 45 + (hash % 15); // 45-60%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Download a file from a URL by fetching it as a blob and triggering a download
 * This forces the browser to download the file instead of opening it
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Failed to download file:', error);
        throw error;
    }
}
