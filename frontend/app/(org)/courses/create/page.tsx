'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LibraryBig, FileText } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Role } from '@/types';
import { useGlobal } from '@/context/GlobalContext';
import { api } from '@/lib/api';
import { mutate } from 'swr';

export default function CreateCoursePage() {
    const { token, user } = useAuth();
    const { dispatch } = useGlobal();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (!token || !user) return;

        // Teachers should not be able to create courses
        if (user.role === Role.TEACHER) {
            router.replace('/courses');
            return;
        }
    }, [token, user, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        dispatch({ type: 'UI_START_PROCESSING', payload: 'course-create' });

        try {
            await api.org.createCourse(formData, token);
            // Invalidate courses cache using SWR mutate
            mutate((key) => Array.isArray(key) && key[0] === 'courses');
            window.dispatchEvent(new Event('stats-updated'));
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Course created successfully', type: 'success' } });
            router.push('/courses');
        } catch (error: unknown) {
            dispatch({ type: 'TOAST_ADD', payload: { message: error instanceof Error ? error.message : 'Failed to create course', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_STOP_PROCESSING', payload: 'course-create' });
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="mb-6 p-2">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 backdrop-blur-md rounded-lg border border-border shadow-xl">
                        <LibraryBig className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-primary tracking-tight drop-shadow-lg">Create Course</h1>
                        <p className="text-muted-foreground font-bold opacity-80 mt-1 tracking-widest text-[10px]">Add a New Subject to Catalog</p>
                    </div>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl rounded-lg shadow-[0_8px_30px_var(--shadow-color)] border border-border p-8 md:p-12 mb-10 text-card-text">
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
                            href="/courses"
                        >
                            <Button type="button" variant="secondary" className="px-10 h-12">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            loadingId="course-create"
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
