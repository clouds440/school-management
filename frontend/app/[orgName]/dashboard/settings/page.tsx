'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Settings, Save, CheckCircle, Mail, MapPin, Phone, School } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';

export default function SettingsPage() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

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
                setErrorMsg('Failed to load settings');
                setLoading(false);
            });
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        setErrorMsg('');

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

            setSuccessMsg('Settings updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            setErrorMsg('Failed to update settings. Please try again.');
        } finally {
            setSaving(false);
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
                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded flex items-center gap-3 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <p>{successMsg}</p>
                    </div>
                )}

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700">
                        <p>{errorMsg}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Organization Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <School className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-400 bg-gray-50/30"
                                    placeholder="School Name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Location</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-400 bg-gray-50/30"
                                    placeholder="City, State"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Contact Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    name="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-400 bg-gray-50/30"
                                    placeholder="contact@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Phone Number</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-400 bg-gray-50/30"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {saving ? 'SAVING CHANGES...' : 'SAVE SETTINGS'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
