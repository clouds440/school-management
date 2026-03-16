'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';
import { ModalForm } from '@/components/ui/ModalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Section, Course, Role, PaginatedResponse } from '@/types';
import { TableActions } from '@/components/ui/TableActions';
import { usePaginatedData, BasePaginationParams } from '@/hooks/usePaginatedData';

interface SectionParams extends BasePaginationParams {
    my?: boolean;
}

export default function SectionsPage() {
    const { token, user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Section> | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);

    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const showOnlyMySections = searchParams.get('my') === 'true';

    const sectionParams: SectionParams = {
        page,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        my: showOnlyMySections
    };

    const { 
        data: fetchedData, 
        loading: isInitialLoading, 
        fetching: isFetching, 
        refresh 
    } = usePaginatedData<Section, SectionParams>(
        (p) => api.org.getSections(token!, p),
        sectionParams,
        `sections-${user?.orgSlug || pathname.split('/')[1]}`
    );

    useEffect(() => {
        setPaginatedData(fetchedData);
    }, [fetchedData]);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', semester: '', year: '', room: '', courseId: '' });
    const [isSaving, setIsSaving] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingSection, setDeletingSection] = useState<Section | null>(null);

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

    const fetchCoursesOnly = useCallback(async () => {
        if (!token) return;
        try {
            const coursesResponse = await api.org.getCourses(token);
            setCourses(Array.isArray(coursesResponse) ? coursesResponse : (coursesResponse as PaginatedResponse<Course>).data || []);
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchCoursesOnly();
    }, [token, fetchCoursesOnly]);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSection || !token) return;
        setIsSaving(true);
        try {
            await api.org.updateSection(editingSection.id, editFormData, token);
            setEditModalOpen(false);
            showToast('Section updated successfully', 'success');
            refresh();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Error updating section', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingSection || !token) return;
        try {
            await api.org.deleteSection(deletingSection.id, token);
            showToast('Section deleted successfully', 'success');
            setDeleteDialogOpen(false);
            refresh();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Error deleting section', 'error');
        }
    };

    const sections = paginatedData?.data || [];
    
    // Client-side filter for "My Sections" if not handled by server
    const filteredSections = sections.filter(section => {
        if (!showOnlyMySections) return true;
        
        const loggedInUserId = user?.sub || user?.id;
        return section.teachers?.some(t => t.userId === loggedInUserId);
    });

    const columns = [
        {
            header: 'Section Name',
            sortable: true,
            sortKey: 'name',
            accessor: (row: Section) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-card-text">{row.name}</span>
                    <span className="text-sm font-medium text-primary">{row.course?.name || 'No Course'}</span>
                </div>
            )
        },
        {
            header: 'Enrolled Teachers',
            sortable: false,
            accessor: (row: Section) => (
                <div className="flex flex-wrap gap-1">
                    {row.teachers && row.teachers.length > 0 ? (
                        row.teachers.map((teacher, idx) => (
                            <span key={idx} className="bg-primary/5 text-primary px-2 py-1 rounded-sm text-xs font-medium border border-primary/10">
                                {teacher.user.name}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 italic text-sm">No teachers</span>
                    )}
                </div>
            )
        },
        {
            header: 'Term',
            sortable: true,
            sortKey: 'semester',
            accessor: (row: Section) => row.semester && row.year ? `${row.semester} ${row.year}` : <span className="text-gray-400 italic">Unspecified</span>
        },
        {
            header: 'Room',
            sortable: true,
            sortKey: 'room',
            accessor: (row: Section) => row.room || <span className="text-gray-400 italic">TBD</span>
        },
        {
            header: 'Actions',
            accessor: (row: Section) => {
                const isAdmin = user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER;
                const isAssignedTeacher = user?.role === Role.TEACHER && row.teachers?.some(t => t.userId === (user.sub || user.id));

                return (
                    <TableActions
                        onEdit={(isAdmin || isAssignedTeacher) ? () => {
                            setEditingSection(row);
                            setEditFormData({
                                name: row.name,
                                semester: row.semester || '',
                                year: row.year || '',
                                room: row.room || '',
                                courseId: row.courseId || ''
                            });
                            setEditModalOpen(true);
                        } : undefined}
                        onDelete={isAdmin ? () => {
                            setDeletingSection(row);
                            setDeleteDialogOpen(true);
                        } : undefined}
                        editTitle="Edit Section"
                        deleteTitle="Delete Section"
                        variant="default"
                        isViewAndEdit={true}
                    />
                );
            }
        }
    ];

    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    if ((!token && !user) || (isFetching && !paginatedData)) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    {(user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) && (
                        <Button
                            onClick={() => router.push(`/${orgSlug}/dashboard/sections/create`)}
                            icon={Plus}
                            className="px-8 py-4"
                        >
                            Create Section
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-card text-card-text rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-white/20 p-6 md:p-8 mb-10">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 max-w-xl">
                        <SearchBar value={searchTerm} onChange={(val) => updateQueryParams({ search: val, page: 1 })} placeholder="Search by name, course, or room..." />
                    </div>
                    {user?.role === Role.TEACHER && (
                        <div className="flex items-center gap-3 bg-primary/5 p-2 pr-4 rounded-sm border border-primary/10">
                            <button
                                onClick={() => updateQueryParams({ my: !showOnlyMySections, page: 1 })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${showOnlyMySections ? 'bg-primary' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOnlyMySections ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className="text-sm font-bold text-card-text uppercase tracking-wider">My Sections</span>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <DataTable
                        data={filteredSections}
                        columns={columns}
                        keyExtractor={(row) => row.id}
                        isLoading={isFetching}
                        onRowClick={(row) => {
                            const isAdmin = user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER;
                            const isAssignedTeacher = user?.role === Role.TEACHER && row.teachers?.some(t => t.userId === (user.sub || user.id));
                            if (isAdmin || isAssignedTeacher) {
                                setEditingSection(row);
                                setEditFormData({
                                    name: row.name,
                                    semester: row.semester || '',
                                    year: row.year || '',
                                    room: row.room || '',
                                    courseId: row.courseId || ''
                                });
                                setEditModalOpen(true);
                            }
                        }}
                        currentPage={page}
                        totalPages={paginatedData?.totalPages || 1}
                        totalResults={paginatedData?.totalRecords || 0}
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
                title="Update Section Information"
                onSubmit={handleEditSubmit}
                isSubmitting={isSaving}
                submitText="Save Changes"
            >
                <div className="space-y-8 py-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Section Name *</label>
                        <input
                            type="text"
                            required
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-6 py-4 rounded-sm border border-gray-200/20 bg-primary/5 focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-card-text font-bold"
                            placeholder="e.g. Section A"
                        />
                    </div>
                    {(user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER') && (
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Course</label>
                            <div className="relative group">
                                <select
                                    required
                                    value={editFormData.courseId}
                                    onChange={(e) => setEditFormData({ ...editFormData, courseId: e.target.value })}
                                    className="w-full px-6 py-4 rounded-sm border border-gray-200/20 bg-primary/5 focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-card-text font-bold appearance-none"
                                >
                                    <option value="" disabled>Select Course</option>
                                    {courses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-400">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Semester</label>
                            <input
                                type="text"
                                value={editFormData.semester}
                                onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                                className="w-full px-6 py-4 rounded-sm border border-gray-200/20 bg-primary/5 focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-card-text font-bold"
                                placeholder="E.g., Fall"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Year</label>
                            <input
                                type="text"
                                value={editFormData.year}
                                onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                                className="w-full px-6 py-4 rounded-sm border border-gray-200/20 bg-primary/5 focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-card-text font-bold"
                                placeholder="E.g., 2026"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Room</label>
                        <input
                            type="text"
                            value={editFormData.room}
                            onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                            className="w-full px-6 py-4 rounded-sm border border-gray-200/20 bg-primary/5 focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-card-text font-bold"
                            placeholder="E.g., 101-B"
                        />
                    </div>
                </div>
            </ModalForm>

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={<>Delete Section <strong>{deletingSection?.name}</strong></>}
                description={<>Are you sure you want to delete <strong>{deletingSection?.name}</strong>?</>}
                confirmText="Yes, Delete Section"
                isDestructive={true}
            />
        </div>
    );
}
