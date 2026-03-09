'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, AlertCircle, FileText, User as UserIcon } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import Link from 'next/link';
import { Teacher } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

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
                            <Label>Class Name *</Label>
                            <Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                icon={BookOpen}
                                placeholder="E.g., Computer Science 101"
                            />
                        </div>

                        <div>
                            <Label>Description</Label>
                            <div className="relative group">
                                <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm resize-none"
                                    placeholder="Brief description of the course content..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <Label>Grade / Class Level</Label>
                                <Input
                                    type="text"
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    icon={BookOpen}
                                    placeholder="E.g., 10th Grade"
                                />
                            </div>

                            <div>
                                <Label>Courses (comma-separated)</Label>
                                <Input
                                    type="text"
                                    name="courses"
                                    value={formData.courses}
                                    onChange={handleChange}
                                    icon={FileText}
                                    placeholder="E.g., Math, Science"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Assign Teacher (Optional)</Label>
                            <Select
                                name="teacherId"
                                value={formData.teacherId}
                                onChange={handleChange as unknown as React.ChangeEventHandler<HTMLSelectElement>}
                                icon={UserIcon}
                            >
                                <option value="" className="text-gray-500 font-medium">Select a teacher...</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id} className="text-gray-900">
                                        {t.user.name || t.user.email} {t.education ? `- ${t.education}` : ''}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="pt-10 mt-10 border-t border-gray-100 flex justify-end gap-5">
                        <Link
                            href={`/${orgSlug}/dashboard/classes`}
                            className="px-8 py-3 text-base font-bold text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 flex items-center shadow-lg border border-transparent"
                        >
                            Cancel
                        </Link>
                        <Button
                            type="submit"
                            isLoading={isSaving}
                            loadingText="Creating..."
                            className="px-10"
                        >
                            Create Class
                        </Button>
                    </div>
                </form>
            </div >
        </div >
    );
}
