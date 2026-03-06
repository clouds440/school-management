'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, AlertCircle, FileText, User } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import Link from 'next/link';

import { useToast } from '@/context/ToastContext';

export default function CreateClassPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    const [isSaving, setIsSaving] = useState(false);
    const [teachers, setTeachers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        grade: '',
        teacherId: ''
    });

    useEffect(() => {
        if (!token) return;
        fetch('http://localhost:3000/org/teachers', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setTeachers(Array.isArray(data) ? data : []))
            .catch(err => console.error('Failed to load teachers', err));
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const submitData = { ...formData };
            if (!submitData.teacherId) delete (submitData as any).teacherId;
            if (!submitData.grade) delete (submitData as any).grade;

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
        } catch (error: any) {
            showToast(error.message || 'Failed to create class', 'error');
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

            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 p-10">

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Class Name *</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/30 shadow-sm"
                                    placeholder="E.g., Computer Science 101"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Description</label>
                            <div className="relative group">
                                <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 resize-y text-gray-900 bg-gray-50/30 shadow-sm"
                                    placeholder="Brief description of the course content..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Grade / Class Level</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/30 shadow-sm"
                                    placeholder="E.g., 10th Grade, Freshman"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Assign Teacher (Optional)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <select
                                    name="teacherId"
                                    value={formData.teacherId}
                                    onChange={handleChange as any}
                                    className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-gray-50/30 shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-gray-500">Select a teacher...</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id} className="text-gray-900">
                                            {t.user.name || t.user.email} {t.education ? `- ${t.education}` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 mt-8 border-t border-gray-100 flex justify-end gap-3">
                        <Link
                            href={`/${orgSlug}/dashboard/classes`}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {isSaving && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
