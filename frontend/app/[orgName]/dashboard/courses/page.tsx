'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { api } from '@/lib/api';
import { ModalForm } from '@/components/ui/ModalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Course, Role } from '@/types';
import { TableActions } from '@/components/ui/TableActions';

export default function CoursesPage() {
    const { token, user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { showToast } = useToast();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

    const fetchCourses = useCallback(async () => {
        if (!token) return;
        try {
            const data = await api.org.getCourses(token);
            setCourses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            showToast('Failed to load courses', 'error');
        } finally {
            setLoading(false);
        }
    }, [token, showToast]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCourse || !token) return;
        setIsSaving(true);
        try {
            await api.org.updateCourse(editingCourse.id, editFormData, token);
            setEditModalOpen(false);
            showToast('Course updated successfully', 'success');
            fetchCourses();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Error updating course', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingCourse || !token) return;
        try {
            await api.org.deleteCourse(deletingCourse.id, token);
            showToast('Course deleted successfully', 'success');
            setDeleteDialogOpen(false);
            fetchCourses();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Error deleting course', 'error');
        }
    };

    const filteredCourses = courses.filter(course => {
        return course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const columns = [
        {
            header: 'Course Name',
            sortable: true,
            sortAccessor: (row: Course) => row.name,
            accessor: (row: Course) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-card-text">{row.name}</span>
                </div>
            )
        },
        {
            header: 'Description',
            sortable: true,
            accessor: (row: Course) => row.description || <span className="text-gray-400 italic">No description</span>
        },
        {
            header: 'Last Updated',
            sortable: true,
            sortAccessor: (row: Course) => new Date(row.updatedAt || '').getTime(),
            accessor: (row: Course) => row.updatedBy ? (
                <div className="flex flex-col">
                    <span className="font-medium text-card-text/80">{row.updatedBy}</span>
                    <span className="text-xs text-card-text/40">{new Date(row.updatedAt || '').toLocaleDateString()}</span>
                </div>
            ) : <span className="text-card-text/30 italic text-sm text-center">Never</span>
        },
        {
            header: 'Actions',
            accessor: (row: Course) => {
                const isAdmin = user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER;
                const isTeacher = user?.role === Role.TEACHER;

                return (
                    <TableActions
                        onEdit={(isAdmin || isTeacher) ? () => {
                            setEditingCourse(row);
                            setEditFormData({
                                name: row.name,
                                description: row.description || ''
                            });
                            setEditModalOpen(true);
                        } : undefined}
                        onDelete={isAdmin ? () => {
                            setDeletingCourse(row);
                            setDeleteDialogOpen(true);
                        } : undefined}
                        editTitle="Edit Course"
                        deleteTitle="Delete Course"
                        variant="default"
                    />
                );
            }
        }
    ];

    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    {(user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) && (
                        <Button
                            onClick={() => router.push(`/${orgSlug}/dashboard/courses/create`)}
                            icon={Plus}
                            className="px-8 py-4"
                        >
                            Create Course
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-card text-card-text rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-white/20 p-6 md:p-8 mb-10">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 max-w-xl">
                        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name or description..." />
                    </div>
                </div>

                <div className="relative">
                    <DataTable
                        data={filteredCourses}
                        columns={columns}
                        keyExtractor={(row) => row.id}
                        isLoading={loading}
                        onRowClick={(row) => {
                            const isAdmin = user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER;
                            const isTeacher = user?.role === Role.TEACHER;
                            if (isAdmin || isTeacher) {
                                setEditingCourse(row);
                                setEditFormData({
                                    name: row.name,
                                    description: row.description || ''
                                });
                                setEditModalOpen(true);
                            }
                        }}
                    />
                </div>
            </div>

            <ModalForm
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Update Course Information"
                onSubmit={handleEditSubmit}
                isSubmitting={isSaving}
                submitText="Save Changes"
            >
                <div className="space-y-8 py-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Course Name *</label>
                        <input
                            type="text"
                            required
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-6 py-4 rounded-sm border border-gray-200/20 bg-primary/5 focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-card-text font-bold"
                            placeholder="e.g. Mathematics"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Description</label>
                        <textarea
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full px-6 py-4 rounded-sm border border-gray-200/20 bg-primary/5 focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[120px] text-card-text font-bold resize-none"
                            placeholder="Briefly describe this course..."
                        />
                    </div>
                </div>
            </ModalForm>

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={<>Delete Course <strong>{deletingCourse?.name}</strong></>}
                description={<>Are you sure you want to delete <strong>{deletingCourse?.name}</strong>? This action cannot be undone.</>}
                confirmText="Yes, Delete Course"
                isDestructive={true}
            />
        </div>
    );
}
