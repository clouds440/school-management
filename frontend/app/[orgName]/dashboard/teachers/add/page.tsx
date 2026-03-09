'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { UserPlus, User, Mail, Lock, BookOpen, DollarSign, Phone } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import Link from 'next/link';

import { useToast } from '@/context/ToastContext';

export default function AddTeacherPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    useEffect(() => {
        if (user && user.role !== 'ORG_ADMIN' && user.role !== 'ORG_MANAGER') {
            router.replace(`/${orgSlug}/dashboard`);
        }
    }, [user, router, orgSlug]);

    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        education: '',
        designation: '',
        subject: '',
        salary: '',
        isManager: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await fetch('http://localhost:3000/org/teachers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone || undefined,
                    education: formData.education || undefined,
                    designation: formData.designation || undefined,
                    subject: formData.subject || undefined,
                    salary: formData.salary ? Number(formData.salary) : undefined,
                    isManager: formData.isManager
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to create teacher');
            }

            showToast('Teacher account created successfully', 'success');
            router.push(`/${orgSlug}/dashboard/teachers`);
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Failed to create teacher', 'error');
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 w-full">
            <div className="mb-8">
                <BackButton />
                <div className="mt-8 flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
                        <UserPlus className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">Add Teacher</h1>
                        <p className="text-indigo-100 font-bold opacity-80 mt-1">CREATE NEW FACULTY ACCOUNT</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-white/50 p-12 animate-fade-in-up">

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <User className="w-6 h-6" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                    placeholder="john.doe@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Initial Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                    placeholder="Min 6 characters"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Phone Number</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Education</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <input
                                    type="text"
                                    name="education"
                                    value={formData.education}
                                    onChange={handleChange}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                    placeholder="M.S. Computer Science"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Designation</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <User className="w-6 h-6" />
                                </div>
                                <input
                                    type="text"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                    placeholder="Senior Teacher"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Subject Specialization</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                    placeholder="E.g., Mathematics"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Base Salary</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <input
                                    type="number"
                                    name="salary"
                                    value={formData.salary}
                                    onChange={handleChange}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                    placeholder="50000"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 mt-4 p-8 bg-indigo-50/50 border border-indigo-100/50 rounded-[2rem] flex items-start space-x-6">
                            <div className="flex items-center h-8">
                                <input
                                    id="isManager"
                                    name="isManager"
                                    type="checkbox"
                                    checked={formData.isManager}
                                    onChange={handleChange}
                                    disabled={user?.role === 'ORG_MANAGER'}
                                    className="w-6 h-6 text-indigo-600 border-gray-300 rounded-lg focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="isManager" className={`text-lg font-bold text-gray-900 ${user?.role === 'ORG_MANAGER' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    Make Org-Manager
                                </label>
                                <p className={`text-gray-500 font-medium mt-1 ${user?.role === 'ORG_MANAGER' ? 'opacity-50' : ''}`}>
                                    Org-Managers have full access to organization settings and can manage other teachers.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 mt-10 border-t border-gray-100 flex justify-end gap-5">
                        <Link
                            href={`/${orgSlug}/dashboard/teachers`}
                            className="px-8 py-4 text-sm font-bold text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95"
                        >
                            {isSaving && (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            Create Teacher Account
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
