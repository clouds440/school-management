'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, ExternalLink, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';

export default function SupportPage() {
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        topic: 'ACCOUNT_STATUS',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            setSubmitting(true);
            await api.org.submitSupportTicket(formData.topic, formData.message, token);
            showToast('Support ticket submitted successfully!', 'success');
            setFormData(prev => ({ ...prev, message: '' }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to submit support ticket';
            showToast(message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    {user?.orgSlug && (
                        <Link
                            href={`/${user.orgSlug}/dashboard`}
                            className="inline-flex items-center text-sm font-bold text-indigo-200 hover:text-white mb-4 transition-colors"
                        >
                            ← Back to Dashboard
                        </Link>
                    )}
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3 drop-shadow-xl">
                        <MessageSquare className="w-10 h-10" />
                        Help & Support
                    </h1>
                    <p className="text-indigo-100 font-bold opacity-80 mt-2 text-lg">
                        WE ARE HERE TO HELP YOU GET BACK ON TRACK
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Form */}
                <div className="bg-white/95 backdrop-blur-2xl p-8 sm:p-10 rounded-sm border border-white/60 shadow-2xl flex flex-col space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Send us a Message</h2>
                        <p className="text-gray-500 font-medium mb-8">
                            Fill out the form below and our team will get back to you shortly.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Support Topic</label>
                                <select
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-sm bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 font-medium appearance-none"
                                >
                                    <option value="ACCOUNT_STATUS">Account Status Inquiry</option>
                                    <option value="GENERAL_SUPPORT">General Support</option>
                                    <option value="BUG_ISSUE">Report a Bug / Issue</option>
                                    <option value="SUGGESTION">Feature Suggestion</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                                <MarkdownEditor
                                    value={formData.message}
                                    onChange={(val) => setFormData({ ...formData, message: val })}
                                    placeholder="Please describe your details here..."
                                    rows={8}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !formData.message.trim()}
                                className="w-full bg-indigo-600 text-white px-8 py-4 rounded-sm font-black text-lg shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        SEND MESSAGE
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-sm border border-white/50 shadow-xl flex items-center gap-6 hover:shadow-2xl transition-all group">
                        <div className="w-16 h-16 shrink-0 bg-indigo-50 rounded-sm flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Mail className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">Email Support</h3>
                            <a href="mailto:support@edumanage.com" className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1">
                                support@edumanage.com
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-sm border border-white/50 shadow-xl flex items-center gap-6 hover:shadow-2xl transition-all group">
                        <div className="w-16 h-16 shrink-0 bg-green-50 rounded-sm flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                            <Phone className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">Direct Line</h3>
                            <p className="text-gray-500 font-medium text-sm">Mon-Fri, 9am - 5pm EST</p>
                            <p className="text-green-600 font-bold mt-1">+1 (800) EDU-HELP</p>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-sm border border-white/50 shadow-xl flex items-center gap-6 hover:shadow-2xl transition-all group">
                        <div className="w-16 h-16 shrink-0 bg-blue-50 rounded-sm flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <MapPin className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">Headquarters</h3>
                            <p className="text-gray-500 font-medium text-sm leading-relaxed">
                                123 Education Plaza, Suite 400<br />
                                New York, NY 10001
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
