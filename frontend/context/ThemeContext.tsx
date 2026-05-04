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

        // --- Semantic Variable Injection ---
        const isDark = effectiveMode === ThemeMode.DARK;

        // 1. Core Backgrounds & Foregrounds
        if (isDark) {
            root.style.setProperty('--background', '#030816'); // Very dark slate
            root.style.setProperty('--foreground', '#f8fafc'); // slate-50
            root.style.setProperty('--card-bg', '#0f172a'); // slate-900
            root.style.setProperty('--card-text', '#f1f5f9'); // slate-100
            root.style.setProperty('--muted-bg', '#1e293b'); // slate-800
            root.style.setProperty('--muted-text', '#94a3b8'); // slate-400
            root.style.setProperty('--accent-bg', '#1e293b');
            root.style.setProperty('--accent-text', '#f1f5f9');
            root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.15)');
            root.style.setProperty('--input-bg', '#020617');
        } else {
            root.style.setProperty('--background', '#ffffff');
            root.style.setProperty('--foreground', '#0f172a'); // slate-900
            root.style.setProperty('--card-bg', '#ffffff');
            root.style.setProperty('--card-text', '#1e293b'); // slate-800
            root.style.setProperty('--muted-bg', '#f1f5f9'); // slate-100
            root.style.setProperty('--muted-text', '#64748b'); // slate-500
            root.style.setProperty('--accent-bg', '#f1f5f9');
            root.style.setProperty('--accent-text', '#0f172a');
            root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.1)'); // More subtle slate-200
            root.style.setProperty('--input-bg', '#ffffff');
        }

        root.style.setProperty('--primary-text', primaryText);
        root.style.setProperty('--secondary-text', secondaryText);


        // Tints & Atmospherics
        // Set doodle
        root.style.setProperty('--chat-doodle', "url('/assets/chat-doodle.svg')");
        root.style.setProperty('--theme-bg', '#020617');

        // Navbar defaults
        root.style.setProperty('--navbar-bg', isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)');
        root.style.setProperty('--navbar-text', isDark ? '#f8fafc' : '#0f172a');

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
            setThemeColors(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
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
    }, [applyTheme, setThemeColors, themeMode, token, userRole]);

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


