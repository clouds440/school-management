'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, Calendar, MapPin, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import { useGlobal } from '@/context/GlobalContext';
import Link from 'next/link';
import { Course, Role } from '@/types';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function CreateSectionPage() {
    const { token, user } = useAuth();
    const { dispatch } = useGlobal();
    const router = useRouter();
    const pathname = usePathname();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    const [courses, setCourses] = useState<Course[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        semester: '',
        year: '',
        room: '',
        courseId: ''
    });

    useEffect(() => {
        if (!token || !user) return;

        // Teachers should not be able to create sections
        if (user.role === Role.TEACHER) {
            router.replace(`/${orgSlug}/sections`);
            return;
        }

        if (user.role === Role.ORG_ADMIN || user.role === Role.ORG_MANAGER) {
            api.org.getCourses(token)
                .then(res => setCourses(res.data || []))
                .catch(err => console.error('Failed to load courses', err));
        }
    }, [token, user, router, orgSlug]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'UI_SET_PROCESSING', payload: true });

        try {
            if (!token) return;
            await api.org.createSection(formData, token);

            window.dispatchEvent(new Event('stats-updated'));
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Section created successfully', type: 'success' } });
            router.push(`/${orgSlug}/sections`);
        } catch (error: unknown) {
            dispatch({ type: 'TOAST_ADD', payload: { message: error instanceof Error ? error.message : 'Failed to create section', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="mb-6 p-2">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 backdrop-blur-md rounded-sm border border-border shadow-xl">
                        < BookOpen className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-primary tracking-tight drop-shadow-lg" > Create Section </h1>
                        < p className="text-muted-foreground font-bold opacity-80 mt-1 uppercase tracking-widest text-[10px]" > ADD A NEW COURSE OFFERING </p>
                    </div>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-border p-8 md:p-12 mb-10 text-card-text">
                <form onSubmit={handleSubmit} className="space-y-8" >
                    <div className="space-y-8" >
                        <div>
                            <Label>Section Name * </Label>
                            < Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                icon={Hash}
                                placeholder="E.g., Section A, Group 1"
                            />
                        </div>

                        < div >
                            <Label>Course * </Label>
                            < CustomSelect
                                value={formData.courseId}
                                onChange={(value) => setFormData({ ...formData, courseId: value })}
                                icon={BookOpen}
                                options={courses.map(c => ({ value: c.id, label: c.name }))}
                                placeholder="Select a course..."
                                required
                                searchable
                            />
                        </div>

                        < div className="grid grid-cols-1 md:grid-cols-2 gap-8" >
                            <div>
                                <Label>Semester </Label>
                                < Input
                                    type="text"
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    icon={Calendar}
                                    placeholder="E.g., Fall"
                                />
                            </div>

                            < div >
                                <Label>Year </Label>
                                < Input
                                    type="text"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    icon={Calendar}
                                    placeholder="E.g., 2026"
                                />
                            </div>
                        </div>

                        < div >
                            <Label>Room </Label>
                            < Input
                                type="text"
                                name="room"
                                value={formData.room}
                                onChange={handleChange}
                                icon={MapPin}
                                placeholder="E.g., Building A - Room 101"
                            />
                        </div>
                    </div>

                    < div className="pt-10 mt-10 border-t border-border flex justify-end gap-5" >
                        <Link
                            href={`/${orgSlug}/sections`}
                        >
                            <Button type="button" variant="secondary" className="px-10 h-12">
                                Cancel
                            </Button>
                        </Link>
                        < Button
                            type="submit"
                            className="px-10 h-12"
                        >
                            Create Section
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
