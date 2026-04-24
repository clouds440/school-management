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
import { Course, Role, ApiError } from '@/types';
import { TableActions } from '@/components/ui/TableActions';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useGlobal } from '@/context/GlobalContext';
import { usePaginatedData, BasePaginationParams } from '@/hooks/usePaginatedData';
import { Loading } from '@/components/ui/Loading';
import { coursesStore } from '@/lib/coursesStore';

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

    // Redundant paginatedData state removed
    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
    const showOnlyMyCourses = searchParams.get('my') === 'true';
    const [pageSize, setPageSize] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('edu-courses-limit');
            return saved ? parseInt(saved, 10) : 10;
        }
        return 10;
    });

    const courseParams: CourseParams = {
        page,
        limit: pageSize,
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
        'courses',
        { enabled: !!token, store: coursesStore }
    );

    useEffect(() => {
        if (user && user.role === Role.STUDENT) {
            router.replace(`/students/${user.id}`);
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

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        localStorage.setItem('edu-courses-limit', String(newSize));
        updateQueryParams({ page: 1 });
    };

    // We no longer need fetchCourses locally as it's handled by the hook

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCourse || !token) return;
        dispatch({ type: 'UI_SET_PROCESSING', payload: true });
        try {
            await api.org.updateCourse(editingCourse.id, editFormData, token);
            coursesStore.invalidate();
            setEditModalOpen(false);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Course updated successfully', type: 'success' } });
            refresh();
        } catch (err: unknown) {
            const apiError = err as ApiError;
            const rawMessage = apiError?.response?.data?.message || apiError?.message || 'Error updating course';
            const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
            dispatch({ type: 'TOAST_ADD', payload: { message, type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingCourse || !token) return;
        try {
            await api.org.deleteCourse(deletingCourse.id, token);
            coursesStore.invalidate();
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Course deleted successfully', type: 'success' } });
            setDeleteDialogOpen(false);
            refresh();
        } catch (err: unknown) {
            const apiError = err as ApiError;
            const rawMessage = apiError?.response?.data?.message || apiError?.message || 'Error deleting course';
            const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
            dispatch({ type: 'TOAST_ADD', payload: { message, type: 'error' } });
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
                    <span className="font-semibold text-card-foreground">{row.name}</span>
                </div>
            )
        },
        {
            header: 'Description',
            sortable: true,
            sortKey: 'description',
            accessor: (row: Course) => row.description || <span className="text-muted-foreground/50 italic">No description</span>
        },
        {
            header: 'Last Updated',
            sortable: true,
            sortKey: 'updatedAt',
            accessor: (row: Course) => (
                <div className="flex flex-col">
                    <span className="font-medium text-card-foreground/80">
                        {row.updatedBy || 'System'}
                    </span>
                    <span className="text-xs text-muted-foreground/40">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : 'Never'}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            width: 210,
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

    if ((!token && !user) || (isFetching && !fetchedData)) {
        return <Loading fullScreen text="Loading Courses..." size="lg" />;
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className="bg-card/80 backdrop-blur-2xl rounded-lg shadow-xl border border-border p-1 md:p-2 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="mb-2 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                    <div className="flex-1 max-w-xl">
                        <SearchBar value={searchTerm} onChange={(val) => updateQueryParams({ search: val, page: 1 })} placeholder="Search by name or description..." />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        {user?.role === Role.ORG_MANAGER && (
                            <div
                                onClick={() => updateQueryParams({ my: !showOnlyMyCourses, page: 1 })}
                                className="flex items-center gap-3 bg-primary/5 p-2 pr-4 rounded-lg border border-primary/10 self-start md:self-auto hover:bg-primary/10 transition-all cursor-pointer group select-none"
                            >
                                <button
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${showOnlyMyCourses ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${showOnlyMyCourses ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                                <span className="text-xs font-bold text-card-foreground tracking-wider">My Courses</span>
                            </div>
                        )}
                        {(user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) && (
                            <Button
                                onClick={() => router.push(`/courses/create`)}
                                icon={Plus}
                                className="px-8 w-full md:w-auto text-xs font-black tracking-widest"
                            >
                                Create Course
                            </Button>
                        )}
                    </div>
                </div>

                <div className="relative overflow-x-hidden flex-1 min-h-0">
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
                        pageSize={pageSize}
                        onPageChange={(p) => updateQueryParams({ page: p })}
                        onPageSizeChange={handlePageSizeChange}
                        maxHeight="100%"
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
                            className="w-full px-6 py-4 rounded-lg border border-border bg-input focus:bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-30 text-card-foreground font-bold resize-none"
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
