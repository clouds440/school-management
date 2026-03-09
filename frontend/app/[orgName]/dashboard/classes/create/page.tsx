'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, AlertCircle, FileText, User as UserIcon } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import Link from 'next/link';
import { Teacher } from '@/types';

import { useToast } from '@/context/ToastContext';

export default function CreateClassPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    const [isSaving, setIsSaving] = useState(false);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        grade: '',
        teacherId: '',
        courses: ''
    });

    useEffect(() => {
        if (!token || !user) return;

        // Teachers should not be able to create classes
        if (user.role === 'TEACHER') {
            router.replace(`/${orgSlug}/dashboard/classes`);
            return;
        }

        if (user.role === 'ORG_ADMIN' || user.role === 'ORG_MANAGER') {
            fetch('http://localhost:3000/org/teachers', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setTeachers(Array.isArray(data) ? data : []))
                .catch(err => console.error('Failed to load teachers', err));
        }
    }, [token, user, router, orgSlug]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const submitData: Record<string, string | string[]> = { ...formData };
            if (!submitData.teacherId) delete submitData.teacherId;
            if (!submitData.grade) delete submitData.grade;

            // Format courses into an array
            submitData.courses = typeof submitData.courses === 'string'
                ? submitData.courses.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
                : [];

            const response = await fetch('http://localhost:3000/org/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to create class');
            }

            showToast('Class created successfully Component', 'success');
            router.push(`/${orgSlug}/dashboard/classes`);
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Failed to create class', 'error');
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 w-full">
            <div className="mb-8">
                <BackButton />
                <div className="mt-8 flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
                        <BookOpen className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">Create Class</h1>
                        <p className="text-indigo-100 font-bold opacity-80 mt-1">ADD NEW ACADEMIC SECTION</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-white/50 p-12 animate-fade-in-up">

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-8">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Class Name *</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                    placeholder="E.g., Computer Science 101"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Description</label>
                            <div className="relative group">
                                <div className="absolute top-4 left-0 pl-5 flex items-start pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 resize-none text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                    placeholder="Brief description of the course content..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Grade / Class Level</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <input
                                        type="text"
                                        name="grade"
                                        value={formData.grade}
                                        onChange={handleChange}
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                        placeholder="E.g., 10th Grade"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Courses (comma-separated)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <input
                                        type="text"
                                        name="courses"
                                        value={formData.courses}
                                        onChange={handleChange}
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm"
                                        placeholder="E.g., Math, Science"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Assign Teacher (Optional)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <select
                                    name="teacherId"
                                    value={formData.teacherId}
                                    onChange={handleChange as unknown as React.ChangeEventHandler<HTMLSelectElement>}
                                    className="w-full pl-14 pr-12 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 font-medium shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-gray-500 font-medium">Select a teacher...</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id} className="text-gray-900">
                                            {t.user.name || t.user.email} {t.education ? `- ${t.education}` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 mt-10 border-t border-gray-100 flex justify-end gap-5">
                        <Link
                            href={`/${orgSlug}/dashboard/classes`}
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
                            Create Class
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
