'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, BookOpen } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { api } from '@/lib/api';
import { ModalForm } from '@/components/ui/ModalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Course, Role, PaginatedResponse, ApiError } from '@/types';
import { TableActions } from '@/components/ui/TableActions';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useGlobal } from '@/context/GlobalContext';
import { usePaginatedData, BasePaginationParams } from '@/hooks/usePaginatedData';
import { Loading } from '@/components/ui/Loading';

interface CourseParams extends BasePaginationParams {
    my?: boolean;
}

export default function CoursesPage() {
    const { token, user } = useAuth();
    const { state, dispatch } = useGlobal();
    const isProcessing = state.ui.isProcessing;

    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    // Redundant paginatedData state removed
    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
    const showOnlyMyCourses = searchParams.get('my') === 'true';

    const courseParams: CourseParams = {
        page,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        my: user?.role === Role.TEACHER ? true : (showOnlyMyCourses || undefined)
    };

    const {
        data: fetchedData,
        fetching: isFetching,
        refresh
    } = usePaginatedData<Course, CourseParams>(
        (p) => api.org.getCourses(token!, p),
        courseParams,
        `courses-${user?.orgSlug || pathname.split('/')[1]}`,
        { enabled: !!token }
    );

    useEffect(() => {
        if (user && user.role === Role.STUDENT) {
            const orgSlug = user.orgSlug || pathname.split('/')[1];
            router.replace(`/${orgSlug}/students/${user.userName}`);
        }
    }, [user, router, pathname]);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', description: '' });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

    const updateQueryParams = (updates: Record<string, string | number | undefined | boolean>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '' || value === false) {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // We no longer need fetchCourses locally as it's handled by the hook

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCourse || !token) return;
        dispatch({ type: 'UI_SET_PROCESSING', payload: true });
        try {
            await api.org.updateCourse(editingCourse.id, editFormData, token);
            setEditModalOpen(false);
            showToast('Course updated successfully', 'success');
            refresh();
        } catch (err: unknown) {
            const apiError = err as ApiError;
            const rawMessage = apiError?.response?.data?.message || apiError?.message || 'Error updating course';
            const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
            showToast(message, 'error');
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingCourse || !token) return;
        try {
            await api.org.deleteCourse(deletingCourse.id, token);
            showToast('Course deleted successfully', 'success');
            setDeleteDialogOpen(false);
            refresh();
        } catch (err: unknown) {
            const apiError = err as ApiError;
            const rawMessage = apiError?.response?.data?.message || apiError?.message || 'Error deleting course';
            const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
            showToast(message, 'error');
        }
    };

    // Redundant courses variable removed. Using fetchedData directly.

    const columns = [
        {
            header: 'Course Name',
            sortable: true,
            sortKey: 'name',
            accessor: (row: Course) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-card-text">{row.name}</span>
                </div>
            )
        },
        {
            header: 'Description',
            sortable: true,
            sortKey: 'description',
            accessor: (row: Course) => row.description || <span className="text-gray-400 italic">No description</span>
        },
        {
            header: 'Last Updated',
            sortable: true,
            sortKey: 'updatedAt',
            accessor: (row: Course) => (
                <div className="flex flex-col">
                    <span className="font-medium text-card-text/80">
                        {row.updatedBy || 'System'}
                    </span>
                    <span className="text-xs text-card-text/40">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : 'Never'}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            accessor: (row: Course) => {
                const isAdmin = user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER;
                const isTeacher = user?.role === Role.TEACHER;

                return (
                    <TableActions
                        onEdit={isAdmin ? () => {
                            setEditingCourse(row);
                            setEditFormData({
                                name: row.name,
                                description: row.description || ''
                            });
                            setEditModalOpen(true);
                        } : undefined}
                        onView={isTeacher ? () => {
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
                        isViewAndEdit={isAdmin}
                    />
                );
            }
        }
    ];

    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    if ((!token && !user) || (isFetching && !fetchedData)) {
        return <Loading fullScreen text="Loading Courses..." size="lg" />;
    }

    return (
        <div className="flex flex-col w-full animate-fade-in-up">
            <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    {(user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) && (
                        <Button
                            onClick={() => router.push(`/${orgSlug}/courses/create`)}
                            icon={Plus}
                            className="px-8 py-4"
                        >
                            Create Course
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/20 p-2 md:p-4 mb-4">
                <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 max-w-xl">
                        <SearchBar value={searchTerm} onChange={(val) => updateQueryParams({ search: val, page: 1 })} placeholder="Search by name or description..." />
                    </div>

                    {user?.role === Role.ORG_MANAGER && (
                        <div className="flex items-center gap-3 bg-primary/5 p-2 pr-4 rounded-sm border border-primary/10 self-start md:self-auto">
                            <button
                                onClick={() => updateQueryParams({ my: !showOnlyMyCourses, page: 1 })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${showOnlyMyCourses ? 'bg-primary' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOnlyMyCourses ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className="text-xs font-bold text-card-text uppercase tracking-wider">My Courses</span>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <DataTable
                        data={fetchedData?.data || []}
                        columns={columns}
                        keyExtractor={(row) => row.id}
                        isLoading={isFetching}
                        onRowClick={(row) => {
                            setEditingCourse(row);
                            setEditFormData({
                                name: row.name,
                                description: row.description || ''
                            });
                            setEditModalOpen(true);
                        }}
                        currentPage={page}
                        totalPages={fetchedData?.totalPages || 1}
                        totalResults={fetchedData?.totalRecords || 0}
                        pageSize={10}
                        onPageChange={(p) => updateQueryParams({ page: p })}
                        sortConfig={{ key: sortBy, direction: sortOrder }}
                        onSort={(key, direction) => updateQueryParams({ sortBy: key, sortOrder: direction })}
                    />
                </div>
            </div>

            <ModalForm
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Update Course Information"
                onSubmit={handleEditSubmit}
                isSubmitting={isProcessing}
                submitText="Save Changes"
                showSubmit={user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER}
            >
                <div className="space-y-8 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="courseName">Course Name *</Label>
                        <Input
                            id="courseName"
                            type="text"
                            required
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            placeholder="e.g. Mathematics"
                            icon={BookOpen}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
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
