'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';
import { Role } from '@/types';

interface ThemeContextType {
    primaryColor: string;
    secondaryColor: string;
    setThemeColors: (primary: string, secondary: string) => void;
    refreshTheme: () => Promise<void>;
}

const DEFAULT_PRIMARY = '#4f46e5'; // indigo-600
const DEFAULT_SECONDARY = '#ffffff';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
    const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);

    const applyTheme = useCallback((primary: string, secondary: string) => {
        const root = document.documentElement;

        // Base Colors
        root.style.setProperty('--primary', primary);
        root.style.setProperty('--secondary', secondary);

        // RBG for opacity support
        const primaryRgb = hexToRgb(primary);
        const secondaryRgb = hexToRgb(secondary);
        if (primaryRgb) root.style.setProperty('--primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
        if (secondaryRgb) root.style.setProperty('--secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);

        // Text Contrast (Automatic black/white text based on background)
        const primaryText = getContrastColor(primary);
        const secondaryText = getContrastColor(secondary);
        root.style.setProperty('--primary-text', primaryText);
        root.style.setProperty('--secondary-text', secondaryText);

        // Sidebar Branding
        // If secondary is "too white", we tint it slightly with primary for a branded look
        const isSecondaryNeutral = isNeutral(secondary);
        const sidebarBg = isSecondaryNeutral ? adjustBrightness(primary, 95) : secondary;
        const sidebarText = getContrastColor(sidebarBg);

        root.style.setProperty('--sidebar-bg', sidebarBg);
        root.style.setProperty('--sidebar-text', sidebarText);
        root.style.setProperty('--sidebar-active-bg', primary);
        root.style.setProperty('--sidebar-active-text', primaryText);

        // Tints & Atmospherics
        // Global Theme Background (Blend of both - Much more subtle/sober)
        const bgBase = adjustBrightness(secondary, -10);
        root.style.setProperty('--theme-bg', bgBase);

        root.style.setProperty('--primary-tint', adjustBrightness(primary, 90));
        root.style.setProperty('--secondary-tint', adjustBrightness(secondary, 90));

        // Hovers - Prioritize Primary variant unless it blends too much
        const bgBrightnessValue = getBrightness(bgBase);
        const primaryHover = adjustBrightness(primary, bgBrightnessValue > 128 ? -15 : 15);
        const secondaryHover = adjustBrightness(secondary, -10);

        root.style.setProperty('--primary-hover', primaryHover);
        root.style.setProperty('--secondary-hover', secondaryHover);

        // Interaction Hover (Used for cards, buttons that aren't specifically primary/secondary)
        root.style.setProperty('--item-hover', isSecondaryNeutral ? 'rgba(var(--primary-rgb), 0.05)' : adjustBrightness(secondary, -5));

        // Navbar Branding
        // Navbar should be a unique variant of primary, fallback to secondary if primary is too dark/clashing
        const navbarBg = adjustBrightness(primary, bgBrightnessValue > 128 ? -10 : 10);
        const navbarText = getContrastColor(navbarBg);

        root.style.setProperty('--navbar-bg', navbarBg);
        root.style.setProperty('--navbar-text', navbarText);

        // Card Background
        const cardBg = isSecondaryNeutral ? '#ffffff' : adjustBrightness(secondary, 5);
        root.style.setProperty('--card-bg', cardBg);
        root.style.setProperty('--card-text', getContrastColor(cardBg));

        // Shadows
        root.style.setProperty('--shadow-color', `rgba(${primaryRgb?.r || 0}, ${primaryRgb?.g || 0}, ${primaryRgb?.b || 0}, 0.15)`);
    }, []);

    const setThemeColors = useCallback((primary: string, secondary: string) => {
        setPrimaryColor(primary);
        setSecondaryColor(secondary);
        applyTheme(primary, secondary);
    }, [applyTheme]);

    const refreshTheme = useCallback(async () => {
        if (!token || !user?.orgSlug || user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) {
            setThemeColors(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
            return;
        }

        try {
            const settings = await api.org.getSettings(token);
            if (settings.accentColor) {
                const primary = settings.accentColor.primary || DEFAULT_PRIMARY;
                const secondary = settings.accentColor.secondary || DEFAULT_SECONDARY;
                setThemeColors(primary, secondary);
            } else {
                setThemeColors(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
            }
        } catch (error) {
            console.error('Failed to fetch theme settings:', error);
            setThemeColors(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
        }
    }, [token, user, setThemeColors]);

    useEffect(() => {
        refreshTheme();
    }, [refreshTheme]);

    return (
        <ThemeContext.Provider value={{ primaryColor, secondaryColor, setThemeColors, refreshTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// --- Utilities ---

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getBrightness(hex: string) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

function getContrastColor(hex: string) {
    const yiq = getBrightness(hex);
    return (yiq >= 128) ? '#111827' : '#ffffff';
}

function isNeutral(hex: string) {
    const rgb = hexToRgb(hex);
    if (!rgb) return true;
    const threshold = 15;
    return Math.abs(rgb.r - rgb.g) < threshold &&
        Math.abs(rgb.g - rgb.b) < threshold &&
        Math.abs(rgb.r - rgb.b) < threshold &&
        (rgb.r > 200 || rgb.r < 50); // very light or very dark grays
}

// Utility to darken/lighten hex colors
function adjustBrightness(hex: string, percent: number) {
    if (!hex || hex[0] !== '#') return hex;

    // Normalize 3-digit hex to 6-digit
    let processedHex = hex.slice(1);
    if (processedHex.length === 3) {
        processedHex = processedHex.split('').map(c => c + c).join('');
    }

    let r = parseInt(processedHex.slice(0, 2), 16);
    let g = parseInt(processedHex.slice(2, 4), 16);
    let b = parseInt(processedHex.slice(4, 6), 16);

    const amount = Math.floor(255 * (percent / 100));

    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));

    const rr = r.toString(16).padStart(2, '0');
    const gg = g.toString(16).padStart(2, '0');
    const bb = b.toString(16).padStart(2, '0');

    return `#${rr}${gg}${bb}`;
}
