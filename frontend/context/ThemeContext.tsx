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

const DEFAULT_PRIMARY = '#0052FF'; // Crypto Blue - Coinbase Blue
const DEFAULT_SECONDARY = '#5B616E'; // Cool Slate

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const userRole = user?.role;
    const [primaryColor, setPrimaryColorState] = useState(DEFAULT_PRIMARY);
    const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
    const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('themeMode');
            if (saved === ThemeMode.DARK || saved === ThemeMode.LIGHT || saved === ThemeMode.SYSTEM) {
                return saved as ThemeMode;
            }
        }
        // Default to system preference if no saved value exists
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? ThemeMode.DARK : ThemeMode.LIGHT;
    });

    const applyTheme = useCallback((primary: string, secondary: string, mode?: ThemeMode) => {
        const root = document.documentElement;

        // Base Colors
        root.style.setProperty('--primary', primary);
        root.style.setProperty('--primary-hover', '#003ECB'); // Primary Hover
        root.style.setProperty('--secondary', secondary);
        root.style.setProperty('--neutral', '#8A919E'); // Neutral
        root.style.setProperty('--success', '#05B169'); // Success
        root.style.setProperty('--warning', '#F0AD4E'); // Warning
        root.style.setProperty('--error', '#DF2935'); // Error

        // RGB for opacity support
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

        // --- Semantic Variable Injection ---
        const isDark = effectiveMode === ThemeMode.DARK;

        // 1. Core Backgrounds & Foregrounds - Crypto Blue Design System
        if (isDark) {
            // Dark Mode Palette
            root.style.setProperty('--background', '#0A0E1A'); // Dark background
            root.style.setProperty('--foreground', '#F9FAFB'); // Light text
            root.style.setProperty('--card-bg', '#111827'); // Dark card surface
            root.style.setProperty('--card-text', '#F3F4F6'); // Card text
            root.style.setProperty('--muted-bg', '#1F2937'); // Muted background
            root.style.setProperty('--muted-text', '#9CA3AF'); // Muted text
            root.style.setProperty('--accent-bg', '#1F2937');
            root.style.setProperty('--accent-text', '#F3F4F6');
            root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
            root.style.setProperty('--input-bg', '#111827');
            root.style.setProperty('--text-primary', '#F9FAFB');
            root.style.setProperty('--text-secondary', '#9CA3AF');
        } else {
            // Light Mode Palette - Crypto Blue Design System
            root.style.setProperty('--background', '#F9FAFB'); // Page background
            root.style.setProperty('--foreground', '#050F1A'); // Text primary
            root.style.setProperty('--card-bg', '#FFFFFF'); // Surface
            root.style.setProperty('--card-text', '#050F1A'); // Card text
            root.style.setProperty('--muted-bg', '#F3F4F6'); // Muted background
            root.style.setProperty('--muted-text', '#6B7280'); // Muted text
            root.style.setProperty('--accent-bg', '#F3F4F6');
            root.style.setProperty('--accent-text', '#050F1A');
            root.style.setProperty('--border-color', '#D1D5DB'); // Border
            root.style.setProperty('--input-bg', '#FFFFFF');
            root.style.setProperty('--text-primary', '#050F1A');
            root.style.setProperty('--text-secondary', '#5B616E');
        }

        root.style.setProperty('--primary-text', primaryText);
        root.style.setProperty('--secondary-text', secondaryText);

        // Tints & Atmospherics
        root.style.setProperty('--chat-doodle', "url('/assets/chat-doodle.svg')");
        root.style.setProperty('--theme-bg', isDark ? '#0A0E1A' : '#F9FAFB');

        // Navbar defaults
        root.style.setProperty('--navbar-bg', isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)');
        root.style.setProperty('--navbar-text', isDark ? '#F9FAFB' : '#050F1A');

        // Shadows
        root.style.setProperty('--shadow-color', isDark ? 'rgba(0,0,0,0.5)' : `rgba(${primaryRgb?.r || 0}, ${primaryRgb?.g || 0}, ${primaryRgb?.b || 0}, 0.15)`);

        // Toggle dark class on html for Tailwind utilities
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
        if (typeof window !== 'undefined') {
            localStorage.setItem('themeMode', mode);
        }
        // recompute secondary from current primary
        const computedSecondary = mode === ThemeMode.DARK ? adjustBrightness(primaryColor, -85) : adjustBrightness(primaryColor, 90);
        setSecondaryColor(computedSecondary);
        applyTheme(primaryColor, computedSecondary, mode);
    }, [applyTheme, primaryColor]);

    const refreshTheme = useCallback(async () => {
        if (!token || userRole === Role.SUPER_ADMIN || userRole === Role.PLATFORM_ADMIN) {
            // For admins, just apply the current theme state, don't reset to defaults
            const computedSecondary = themeMode === ThemeMode.DARK ? adjustBrightness(primaryColor, -85) : adjustBrightness(primaryColor, 90);
            applyTheme(primaryColor, computedSecondary, themeMode);
            return;
        }

        try {
            const settings = await api.org.getOrgData(token);
            if (settings.accentColor) {
                const primary = settings.accentColor.primary || DEFAULT_PRIMARY;
                // Use the component's state or user's preferred theme, don't force from org settings if not present
                const mode = themeMode ?? ThemeMode.SYSTEM;
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
    }, [applyTheme, setThemeColors, themeMode, token, userRole, primaryColor]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshTheme();
    }, [refreshTheme]);

    useEffect(() => {
        if (themeMode !== ThemeMode.SYSTEM) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            applyTheme(primaryColor, secondaryColor, ThemeMode.SYSTEM);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themeMode, primaryColor, secondaryColor, applyTheme]);

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


