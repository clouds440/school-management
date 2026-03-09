'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Settings, Save, CheckCircle, Mail, MapPin, Phone, School, RefreshCw, ShieldOff } from 'lucide-react';

import { BackButton } from '@/components/ui/BackButton';
import { api } from '@/src/lib/api';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';


export default function SettingsPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [reapplying, setReapplying] = useState(false);
    const [orgData, setOrgData] = useState<any>(null);


    const [formData, setFormData] = useState({
        name: '',
        location: '',
        contactEmail: '',
        phone: ''
    });

    useEffect(() => {
        if (!token) return;

        fetch('http://localhost:3000/org/settings', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setOrgData(data);
                setFormData({
                    name: data.name || '',
                    location: data.location || '',
                    contactEmail: data.contactEmail || '',
                    phone: data.phone || ''
                });
                setLoading(false);
            })

            .catch(err => {
                console.error('Failed to load settings', err);
                showToast('Failed to load settings', 'error');
                setLoading(false);
            });

    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {

            const response = await fetch('http://localhost:3000/org/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update settings');

            showToast('Settings updated successfully!', 'success');
        } catch (error) {
            showToast('Failed to update settings. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReapply = async () => {
        if (!token) return;
        setReapplying(true);
        try {
            await api.org.reapply(token);
            showToast('Your re-application has been submitted!', 'success');
            // Refresh data
            const res = await fetch('http://localhost:3000/org/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setOrgData(data);
        } catch (error) {
            showToast('Failed to re-apply', 'error');
        } finally {
            setReapplying(false);
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8">
                <BackButton />
                <div className="mt-8 flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
                        <Settings className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg">Settings</h1>
                        <p className="text-indigo-100 font-bold opacity-80 mt-1">ORGANIZATION PROFILE & CONFIGURATION</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 p-10 mb-10">
                {orgData?.status === 'REJECTED' && (
                    <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                                <ShieldOff className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900 leading-tight">Your application was rejected</h4>
                                <p className="text-sm text-gray-600 font-medium mt-1">
                                    Please correct the details below and re-submit for review.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleReapply}
                            disabled={reapplying}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
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


                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                    <div className="pt-8 border-t border-gray-100 flex justify-end">
                        <Button
                            type="submit"
                            isLoading={saving}
                            loadingText="SAVING CHANGES..."
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
