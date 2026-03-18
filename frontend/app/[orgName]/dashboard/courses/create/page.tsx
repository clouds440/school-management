'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { LibraryBig, FileText } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Role } from '@/types';

export default function CreateCoursePage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (!token || !user) return;

        // Teachers should not be able to create courses
        if (user.role === Role.TEACHER) {
            router.replace(`/${orgSlug}/dashboard/courses`);
            return;
        }
    }, [token, user, router, orgSlug]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const submitData = { ...formData };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/org/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to create course');
            }

            showToast('Course created successfully', 'success');
            router.push(`/${orgSlug}/dashboard/courses`);
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Failed to create course', 'error');
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="mb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl">
                        <LibraryBig className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">Create Course</h1>
                        <p className="text-white/80 font-bold opacity-80 mt-1 uppercase tracking-widest text-[10px]">ADD A NEW SUBJECT TO CATALOG</p>
                    </div>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl rounded-sm shadow-[0_30px_70px_var(--shadow-color)] border border-white/20 p-12 text-card-text">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-8">
                        <div>
                            <Label>Course Name *</Label>
                            <Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                icon={LibraryBig}
                                placeholder="E.g., Mathematics"
                            />
                        </div>

                        <div>
                            <Label>Description</Label>
                            <div className="relative group">
                                <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-card-text/40 group-focus-within:text-primary transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full pl-11 pr-4 py-3 rounded-sm border border-white/10 bg-primary/5 text-card-text placeholder:text-card-text/40 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm transition-all duration-200 shadow-sm resize-none outline-none font-bold"
                                    placeholder="Brief description of the course content..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 mt-10 border-t border-gray-100 flex justify-end gap-5">
                        <Link
                            href={`/${orgSlug}/dashboard/courses`}
                            className="px-8 py-3 text-base font-bold text-secondary-text bg-secondary rounded-sm hover:brightness-110 transition-all hover:scale-105 active:scale-95 flex items-center shadow-lg border border-transparent"
                        >
                            Cancel
                        </Link>
                        <Button
                            type="submit"
                            isLoading={isSaving}
                            loadingText="Creating..."
                            className="px-10"
                        >
                            Create Course
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
