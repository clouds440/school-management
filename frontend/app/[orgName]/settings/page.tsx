'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Settings, Save, CheckCircle, Mail, MapPin, Phone, School, RefreshCw, ShieldOff } from 'lucide-react';
import { api } from '@/lib/api';
import { Organization } from '@/types';
import { PhotoUploadPicker } from '@/components/ui/PhotoUploadPicker';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { useGlobal } from '@/context/GlobalContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
    const { token } = useAuth();
    const { state, dispatch } = useGlobal();
    const loading = state.ui.isLoading;
    const saving = state.ui.isProcessing;
    const [reapplying, setReapplying] = useState(false);
    const [orgData, setOrgData] = useState<Organization | null>(null);
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        contactEmail: '',
        phone: '',
        accentColor: {
            primary: '#4f46e5',
            secondary: '#ffffff'
        }
    });

    useEffect(() => {
        if (!token) return;

        dispatch({ type: 'UI_SET_LOADING', payload: true });
        api.org.getOrgData(token)
            .then((data: Organization) => {
                setOrgData(data);
                setFormData({
                    name: data.name || '',
                    location: data.location || '',
                    contactEmail: data.contactEmail || '',
                    phone: data.phone || '',
                    accentColor: {
                        primary: data.accentColor?.primary || '#4f46e5',
                        secondary: data.accentColor?.secondary || '#ffffff'
                    }
                });
            })
            .catch((err) => {
                console.error('Failed to load settings', err);
                const message = err instanceof Error ? err.message : 'Failed to load settings';
                dispatch({ type: 'TOAST_ADD', payload: { message, type: 'error' } });
            })
            .finally(() => {
                dispatch({ type: 'UI_SET_LOADING', payload: false });
            });
    }, [token, dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // const handleColorChange = (type: 'primary' | 'secondary', value: string) => {
    //     const newColors = { ...formData.accentColor, [type]: value };
    //     setFormData({
    //         ...formData,
    //         accentColor: newColors
    //     });
    //     // Live preview
    //     setThemeColors(newColors.primary, newColors.secondary);
    // };

    const handleLogoReady = useCallback((file: File) => {
        setPendingLogoFile(file);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        dispatch({ type: 'UI_SET_PROCESSING', payload: true });
        try {
            // 1. Save text settings
            await api.org.updateSettings(formData, token);

            // 2. Upload logo if one was selected
            if (pendingLogoFile) {
                const logoRes = await api.org.uploadLogo(pendingLogoFile, token);
                // Update local org data so the avatar reflects the new URL
                setOrgData((prev: Organization | null) => prev ? { ...prev, logoUrl: logoRes.logoUrl, avatarUpdatedAt: logoRes.avatarUpdatedAt } : prev);
                setPendingLogoFile(null);
            }

            dispatch({ type: 'TOAST_ADD', payload: { message: 'Settings updated successfully!', type: 'success' } });
        } catch (error) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to update settings. Please try again.', type: 'error' } });
            console.error('Failed to update settings', error);
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleReapply = async () => {
        if (!token) return;
        setReapplying(true);
        try {
            await api.org.reapply(token);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Your re-application has been submitted!', type: 'success' } });
            const data = await api.org.getOrgData(token);
            setOrgData(data);
        } catch (error) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to re-apply', type: 'error' } });
            console.error('Failed to re-apply', error);
        } finally {
            setReapplying(false);
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col max-w-7xl mx-auto w-full">
            <div className="mb-2">
                <div className="mt-2 flex items-center gap-5">
                    <div className="p-4 bg-primary/10 backdrop-blur-md rounded-sm border border-black/30 shadow-xl">
                        <Settings className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-primary tracking-tight drop-shadow-lg">Settings</h1>
                        <p className="text-gray-600 font-bold opacity-80 mt-1 uppercase tracking-wider">Organization Profile & Configuration</p>
                    </div>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/20 p-6 md:p-10 mb-10 text-card-text">
                {orgData?.status === 'REJECTED' && (
                    <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100/50 rounded-sm text-red-600">
                                <ShieldOff className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-red-600 leading-tight">Your application was rejected</h4>
                                <div className="mt-2">
                                    <MarkdownRenderer
                                        content={orgData?.statusHistory && orgData.statusHistory.length > 0
                                            ? orgData.statusHistory[orgData.statusHistory.length - 1].message
                                            : 'Please correct the details below and re-submit for review.'}
                                        className="text-sm text-red-600/70 font-medium prose prose-red prose-sm max-w-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleReapply}
                            disabled={reapplying}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-sm font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                            {reapplying ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                            RE-SUBMIT FOR REVIEW
                        </button>
                    </div>
                )}


                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Logo section */}
                    <div className="flex flex-col items-center gap-2 pb-6 border-b border-white/10">
                        <Label className="mb-1">Organization Logo</Label>
                        <PhotoUploadPicker
                            currentImageUrl={orgData?.logoUrl}
                            onFileReady={handleLogoReady}
                            type="org"
                            hint="Click to change logo — saved when you click Save Settings"
                        />
                        {pendingLogoFile && (
                            <p className="text-xs text-primary font-bold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                New logo ready — will upload on save
                            </p>
                        )}
                    </div>

                    {/* Branding Section (Disabled for now due to UI issues) */}
                    {/* <div className="py-6 border-b border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                            <Palette className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-black text-card-text uppercase tracking-tight">Organization Branding</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <Label>Primary Accent Color</Label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div 
                                            className="w-12 h-12 rounded-sm border border-white/10 shadow-inner shrink-0"
                                            style={{ backgroundColor: formData.accentColor.primary }}
                                        />
                                        <div className="flex-1">
                                            <input
                                                type="color"
                                                value={formData.accentColor.primary}
                                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                                className="w-full h-10 p-1 rounded-sm border border-white/10 bg-primary/5 cursor-pointer"
                                            />
                                            <p className="text-[10px] text-card-text/40 mt-1 font-bold uppercase tracking-widest leading-none">HEX: {formData.accentColor.primary}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-card-text/60 mt-2 leading-relaxed font-medium">
                                        Used for buttons, active states, and main accents across your portal.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Secondary Accent Color</Label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div 
                                            className="w-12 h-12 rounded-sm border border-white/10 shadow-inner shrink-0"
                                            style={{ backgroundColor: formData.accentColor.secondary }}
                                        />
                                        <div className="flex-1">
                                            <input
                                                type="color"
                                                value={formData.accentColor.secondary}
                                                onChange={(e) => handleColorChange('secondary', e.target.value)}
                                                className="w-full h-10 p-1 rounded-sm border border-white/10 bg-primary/5 cursor-pointer"
                                            />
                                            <p className="text-[10px] text-card-text/40 mt-1 font-bold uppercase tracking-widest leading-none">HEX: {formData.accentColor.secondary}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-card-text/60 mt-2 leading-relaxed font-medium">
                                        Used for secondary buttons and backgrounds. Light colors work best.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div> */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        <div>
                            <Label>Organization Name</Label>
                            <Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                icon={School}
                                placeholder="School Name"
                            />
                        </div>

                        <div>
                            <Label>Location</Label>
                            <Input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                icon={MapPin}
                                placeholder="City, State"
                            />
                        </div>

                        <div>
                            <Label>Contact Email</Label>
                            <Input
                                type="email"
                                name="contactEmail"
                                value={formData.contactEmail}
                                onChange={handleChange}
                                icon={Mail}
                                placeholder="contact@example.com"
                            />
                        </div>

                        <div>
                            <Label>Phone Number</Label>
                            <Input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                icon={Phone}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-end">
                        <Button
                            type="submit"
                            className="px-10"
                            icon={Save}
                        >
                            SAVE SETTINGS
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
