'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';
import { Role, ThemeMode } from '@/types';

interface ThemeContextType {
    primaryColor: string;
    secondaryColor: string;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
    setPrimaryColor: (primary: string) => Promise<void>;
        setThemeColors: (primary: string, secondary: string) => void;
        refreshTheme: () => Promise<void>;
}

const DEFAULT_PRIMARY = '#4f46e5'; // indigo-600
const DEFAULT_SECONDARY = '#f0f0f0';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const [primaryColor, setPrimaryColorState] = useState(DEFAULT_PRIMARY);
    const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
    const [themeMode, setThemeModeState] = useState<ThemeMode>(ThemeMode.SYSTEM);

    const applyTheme = useCallback((primary: string, secondary: string, mode?: ThemeMode) => {
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

        // Global foreground (text) color depends on mode
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const effectiveMode = (mode && mode !== ThemeMode.SYSTEM) ? mode : (prefersDark ? ThemeMode.DARK : ThemeMode.LIGHT);
        if (effectiveMode === ThemeMode.DARK) {
            root.style.setProperty('--foreground', '#ffffff');
        } else {
            root.style.setProperty('--foreground', '#0f172a');
        }
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
        // Set doodle based on mode
        if (effectiveMode === ThemeMode.DARK) {
            root.style.setProperty('--chat-doodle', "url('/assets/chat-doodle-dark.jpg')");
        } else {
            root.style.setProperty('--chat-doodle', "url('/assets/chat-doodle-light.jpg')");
        }
        root.style.setProperty('--theme-bg', bgBase);

        // Ensure site-wide background/card/navbar follow strict light/dark expectations
        // Light: pure white site; Dark: dark gray site
        if (effectiveMode === ThemeMode.DARK) {
            root.style.setProperty('--background', '#0b1220');
            root.style.setProperty('--card-bg', '#0f1724');
            root.style.setProperty('--navbar-bg', '#0b1220');
        } else {
            root.style.setProperty('--background', '#ffffff');
            root.style.setProperty('--card-bg', '#ffffff');
            root.style.setProperty('--navbar-bg', '#ffffff');
        }

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

        // Toggle dark class on html for Tailwind utilities
        const isDark = effectiveMode === ThemeMode.DARK;
        if (isDark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    }, []);

    const setThemeColors = useCallback((primary: string, secondary: string) => {
        setPrimaryColorState(primary);
        setSecondaryColor(secondary);
        applyTheme(primary, secondary);
    }, [applyTheme]);

    // Save primary only; secondary is computed
    const setPrimaryColor = useCallback(async (primary: string) => {
        const mode = themeMode;
        // Compute secondary based on mode
        const computedSecondary = mode === ThemeMode.DARK ? adjustBrightness(primary, -85) : adjustBrightness(primary, 90);
        setPrimaryColorState(primary);
        setSecondaryColor(computedSecondary);
        applyTheme(primary, computedSecondary, mode);
    }, [applyTheme, themeMode]);

    // Preview-only: set theme mode locally (no DB persistence). Settings form will persist on save.
    const setThemeMode = useCallback(async (mode: ThemeMode) => {
        setThemeModeState(mode);
        // recompute secondary from current primary
        const computedSecondary = mode === ThemeMode.DARK ? adjustBrightness(primaryColor, -85) : adjustBrightness(primaryColor, 90);
        setSecondaryColor(computedSecondary);
        applyTheme(primaryColor, computedSecondary, mode);
    }, [applyTheme, primaryColor]);

    const refreshTheme = useCallback(async () => {
        if (!token || !user?.orgSlug || user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) {
            setThemeColors(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
            return;
        }

        try {
            const settings = await api.org.getOrgData(token);
            if (settings.accentColor) {
                const primary = settings.accentColor.primary || DEFAULT_PRIMARY;
                const mode = (settings.accentColor.mode as ThemeMode) || ThemeMode.SYSTEM;
                setThemeModeState(mode);
                const secondary = settings.accentColor.secondary || (mode === ThemeMode.DARK ? adjustBrightness(primary, -85) : adjustBrightness(primary, 90));
                setPrimaryColorState(primary);
                setSecondaryColor(secondary);
                applyTheme(primary, secondary, mode);
            } else {
                setThemeColors(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
            }
        } catch (error: unknown) {
            console.error('Failed to fetch theme settings:', error);
            setThemeColors(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
        }
    }, [token, user, setThemeColors]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshTheme();
    }, [refreshTheme]);

    return (
        <ThemeContext.Provider value={{ primaryColor, secondaryColor, themeMode, setThemeMode, setPrimaryColor, setThemeColors, refreshTheme }}>
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


