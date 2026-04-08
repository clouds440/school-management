'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { LibraryBig, FileText } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Role } from '@/types';
import { useGlobal } from '@/context/GlobalContext';
import { api } from '@/lib/api';

export default function CreateCoursePage() {
    const { token, user } = useAuth();
    const { dispatch } = useGlobal();
    const router = useRouter();
    const pathname = usePathname();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (!token || !user) return;

        // Teachers should not be able to create courses
        if (user.role === Role.TEACHER) {
            router.replace(`/${orgSlug}/courses`);
            return;
        }
    }, [token, user, router, orgSlug]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        dispatch({ type: 'UI_SET_PROCESSING', payload: true });

        try {
            await api.org.createCourse(formData, token);
            window.dispatchEvent(new Event('stats-updated'));
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Course created successfully', type: 'success' } });
            router.push(`/${orgSlug}/courses`);
        } catch (error: unknown) {
            dispatch({ type: 'TOAST_ADD', payload: { message: error instanceof Error ? error.message : 'Failed to create course', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="mb-6 p-2">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 backdrop-blur-md rounded-sm border border-black/30 shadow-xl">
                        <LibraryBig className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-primary tracking-tight drop-shadow-lg">Create Course</h1>
                        <p className="text-gray-600 font-bold opacity-80 mt-1 uppercase tracking-widest text-[10px]">ADD A NEW SUBJECT TO CATALOG</p>
                    </div>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-black/20 p-8 md:p-12 mb-10 text-card-text">
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
                            <div>
                                <Label className="sr-only">Course Description</Label>
                                <Textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    icon={FileText}
                                    placeholder="Brief description of the course content..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 mt-10 border-t border-border flex justify-end gap-5">
                        <Link
                            href={`/${orgSlug}/courses`}
                        >
                            <Button type="button" variant="secondary" className="px-10 h-12">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="px-10 h-12"
                        >
                            Create Course
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
