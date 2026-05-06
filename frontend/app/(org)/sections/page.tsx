'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Plus } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { api } from '@/lib/api';
import { ModalForm } from '@/components/ui/ModalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Section, Course, Role, PaginatedResponse, Student } from '@/types';
import { TableActions } from '@/components/ui/TableActions';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomMultiSelect } from '@/components/ui/CustomMultiSelect';
import { useGlobal } from '@/context/GlobalContext';
import { Toggle } from '@/components/ui/Toggle';
import { Loading } from '@/components/ui/Loading';
import { Drawer } from '@/components/ui/Drawer';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import useSWR, { mutate } from 'swr';
import { matchesCacheKeyPrefix } from '@/lib/swr';

interface SectionParams {
    page: number;
    limit: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    my?: boolean;
}

export default function SectionsPage() {
    const { token, user } = useAuth();
    const { state, dispatch } = useGlobal();
    const isProcessing = state.ui.processing['section-edit'];

    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // SWR for courses (for edit form dropdown) - replaces useCallback + useEffect
    const coursesKey = token ? ['courses', { limit: 1000 }] as const : null;
    const { data: coursesData, error: coursesError, mutate: mutateCourses } = useSWR<PaginatedResponse<Course>>(coursesKey);
    const courses = coursesData?.data || [];

    // Students state remains (on-demand fetch for enrollment)
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const showOnlyMySections = searchParams.get('my') === 'true';
    const [pageSize, setPageSize] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('edu-sections-limit');
            return saved ? parseInt(saved, 10) : 10;
        }
        return 10;
    });

    const sectionParams: SectionParams = {
        page,
        limit: pageSize,
        search: searchTerm,
        sortBy,
        sortOrder,
        my: user?.role === Role.TEACHER ? true : showOnlyMySections
    };

    // SWR for sections data - replaces usePaginatedData
    const sectionsKey = token ? ['sections', sectionParams] as const : null;
    const { data: fetchedData, isLoading: isFetching, error: sectionsError, mutate: mutateSections } = useSWR<
        PaginatedResponse<Section>
    >(sectionsKey);

    useEffect(() => {
        if (user && user.role === Role.STUDENT) {
            router.replace(`/students/${user.id}`);
        }
    }, [user, router, pathname]);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', semester: '', year: '', room: '', courseId: '' });

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

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        localStorage.setItem('edu-sections-limit', String(newSize));
        updateQueryParams({ page: 1 });
    };

    // On-demand fetch for students (only needed when editing)
    const fetchStudents = useCallback(async () => {
        if (!token) return;
        try {
            const studentsResponse = await api.org.getStudents(token);
            setStudents(Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse as PaginatedResponse<Student>).data || []);
        } catch (err: unknown) {
            console.error(err);
        }
    }, [token]);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSection || !token) return;
        dispatch({ type: 'UI_START_PROCESSING', payload: 'section-edit' });
        try {
            await api.org.updateSection(editingSection.id, editFormData, token);

            // Handle student enrollment changes
            const currentlyEnrolledIds = editingSection.students?.map(s => s.id) || [];
            const newlyEnrolledIds = selectedStudentIds.filter(id => !currentlyEnrolledIds.includes(id));
            const removedIds = currentlyEnrolledIds.filter(id => !selectedStudentIds.includes(id));

            // Add newly enrolled students
            for (const studentId of newlyEnrolledIds) {
                try {
                    const student = students.find(s => s.id === studentId);
                    if (!student) continue;
                    const currentSectionIds = student.enrollments?.map((e: { section?: { id?: string } }) => e.section?.id).filter((id: string | undefined): id is string => Boolean(id)) || [];
                    await api.org.updateStudent(studentId, { sectionIds: [...currentSectionIds, editingSection.id] }, token);
                } catch (error) {
                    console.error(`Failed to enroll student ${studentId}:`, error);
                    throw error;
                }
            }

            // Remove students who were unenrolled
            for (const studentId of removedIds) {
                try {
                    const student = students.find(s => s.id === studentId);
                    if (!student) continue;
                    const currentSectionIds = student.enrollments?.map((e: { section?: { id?: string } }) => e.section?.id).filter((id: string | undefined): id is string => Boolean(id)) || [];
                    await api.org.updateStudent(studentId, { sectionIds: currentSectionIds.filter((id: string) => id !== editingSection.id) }, token);
                } catch (error) {
                    console.error(`Failed to unenroll student ${studentId}:`, error);
                    throw error;
                }
            }

            setEditModalOpen(false);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Section updated successfully', type: 'success' } });
            mutate(matchesCacheKeyPrefix('sections'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error updating section';
            dispatch({ type: 'TOAST_ADD', payload: { message, type: 'error' } });
        } finally {
            dispatch({ type: 'UI_STOP_PROCESSING', payload: 'section-edit' });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingSection || !token) return;
        try {
            await api.org.deleteSection(deletingSection.id, token);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Section deleted successfully', type: 'success' } });
            setDeleteDialogOpen(false);
            mutate(matchesCacheKeyPrefix('sections'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error deleting section';
            dispatch({ type: 'TOAST_ADD', payload: { message, type: 'error' } });
        }
    };

    // Redundant sections variable removed. Using fetchedData directly.

    const columns = [
        {
            header: 'Section Name',
            sortable: true,
            sortKey: 'name',
            accessor: (row: Section) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-card-foreground">{row.name}</span>
                    <span className="text-sm font-medium text-primary">{row.course?.name || 'No Course'}</span>
                </div>
            )
        },
        {
            header: 'Assigned Teachers',
            sortable: false,
            accessor: (row: Section) => (
                <div className="flex flex-wrap gap-1">
                    {row.teachers && row.teachers.length > 0 ? (
                        row.teachers.map((teacher, idx) => (
                            <Badge key={idx} variant="secondary" size="sm">
                                {teacher.user.name}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-muted-foreground/50 text-sm italic">No teachers</span>
                    )}
                </div>
            )
        },
        {
            header: 'Enrolled Students',
            sortable: false,
            accessor: (row: Section) => {
                const studentsList = row.students || [];
                return studentsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-50">
                        <Badge variant="secondary" size="sm" className="truncate max-w-37.5" title='Click edit icon to view all'>
                            {studentsList.length === 1 ? '1 Student' : studentsList.length + ' Students'}
                        </Badge>
                    </div>
                ) : <span className="text-muted-foreground/30 italic">No students</span>;
            }
        },
        {
            header: 'Term',
            sortable: true,
            sortKey: 'semester',
            accessor: (row: Section) => row.semester && row.year ? `${row.semester} ${row.year}` : <span className="text-muted-foreground/50 italic">Unspecified</span>
        },
        {
            header: 'Room',
            sortable: true,
            sortKey: 'room',
            accessor: (row: Section) => row.room || <span className="text-muted-foreground/50 italic">TBD</span>
        },
        {
            header: 'Actions',
            width: 210,
            accessor: (row: Section) => {
                const isAdmin = user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER;
                return (
                    <TableActions
                        onEdit={isAdmin ? () => {
                            setEditingSection(row);
                            setEditFormData({
                                name: row.name,
                                semester: row.semester || '',
                                year: row.year || '',
                                room: row.room || '',
                                courseId: row.courseId || ''
                            });
                            // Fetch students and pre-select enrolled ones
                            fetchStudents().then(() => {
                                const enrolledStudentIds = row.students?.map(s => s.id) || [];
                                setSelectedStudentIds(enrolledStudentIds);
                            });
                            setEditModalOpen(true);
                        } : undefined}
                        onView={() => {
                            setEditingSection(row);
                            setEditFormData({
                                name: row.name,
                                semester: row.semester || '',
                                year: row.year || '',
                                room: row.room || '',
                                courseId: row.courseId || ''
                            });
                            setEditModalOpen(true);
                        }}
                        onDelete={isAdmin ? () => {
                            setDeletingSection(row);
                            setDeleteDialogOpen(true);
                        } : undefined}
                        editTitle="Edit Section"
                        deleteTitle="Delete Section"
                        variant="default"
                        isViewAndEdit={isAdmin}
                    />
                );
            }
        }
    ];

    if ((!token && !user) || (isFetching && !fetchedData)) {
        return <Loading className="h-full" text="Loading Sections..." size="lg" />;
    }

    if (sectionsError) {
        return <ErrorState error={sectionsError} onRetry={() => {
            mutateSections();
            mutateCourses();
        }} />;
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className="bg-card/80 backdrop-blur-2xl rounded-lg shadow-xl border border-border p-1 md:p-2 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="mb-2 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
                    <div className="flex-1 w-full">
                        <SearchBar value={searchTerm} onChange={(val) => updateQueryParams({ search: val, page: 1 })} placeholder="Search by name, course, or room..." />
                    </div>

                    <div className='flex w-full md:w-auto gap-2 justify-between'>
                        {user?.role === Role.ORG_MANAGER && (
                            <Drawer position='left'>
                                <div className="flex flex-col">
                                    {/* My Sections Toggle */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">My Sections</span>
                                        <Toggle
                                            checked={showOnlyMySections}
                                            onCheckedChange={(checked) => updateQueryParams({ my: checked, page: 1 })}
                                        />
                                    </div>
                                </div>
                            </Drawer>
                        )}

                        {(user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) && (
                            <Button
                                onClick={() => router.push('/sections/create')}
                                icon={Plus}
                                className="shrink-0"
                            >
                                Create Section
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
                        onRowClick={(row) => router.push(`/sections/${row.id}`)}
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
                title="Update Section Information"
                onSubmit={handleEditSubmit}
                isSubmitting={isProcessing}
                loadingId="section-edit"
                submitText="Save Changes"
                showSubmit={user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER}
            >
                <div className="space-y-8 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="sectionName">Section Name *</Label>
                        <Input
                            id="sectionName"
                            type="text"
                            required
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            placeholder="e.g. Section A"
                            icon={BookOpen}
                            readOnly={user?.role === Role.TEACHER}
                            disabled={user?.role === Role.TEACHER}
                        />
                    </div>
                    {(user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) ? (
                        <div className="space-y-2">
                            <Label>Course</Label>
                            <CustomSelect
                                options={courses.map(c => ({ value: c.id, label: c.name, icon: BookOpen }))}
                                value={editFormData.courseId}
                                onChange={(val) => setEditFormData({ ...editFormData, courseId: val })}
                                placeholder="Select Course"
                                required
                                searchable
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Course</Label>
                            <Input
                                value={courses.find(c => c.id === editFormData.courseId)?.name || 'N/A'}
                                readOnly
                                disabled
                                icon={BookOpen}
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="semester">Semester</Label>
                            <Input
                                id="semester"
                                type="text"
                                value={editFormData.semester}
                                onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                                placeholder="E.g., Fall"
                                readOnly={user?.role === Role.TEACHER}
                                disabled={user?.role === Role.TEACHER}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="year">Year</Label>
                            <Input
                                id="year"
                                type="text"
                                value={editFormData.year}
                                onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                                placeholder="E.g., 2026"
                                readOnly={user?.role === Role.TEACHER}
                                disabled={user?.role === Role.TEACHER}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="room">Room</Label>
                        <Input
                            id="room"
                            type="text"
                            value={editFormData.room}
                            onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                            placeholder="E.g., 101-B"
                            readOnly={user?.role === Role.TEACHER}
                            disabled={user?.role === Role.TEACHER}
                        />
                    </div>
                    {(user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) && (
                        <div className="space-y-2">
                            <Label>Enroll Students</Label>
                            <CustomMultiSelect
                                options={students.map(s => ({ value: s.id, label: `${s.user.name} (${s.registrationNumber || 'N/A'})` }))}
                                values={selectedStudentIds}
                                onChange={(vals) => setSelectedStudentIds(vals)}
                                placeholder="Select students to enroll..."
                            />
                        </div>
                    )}
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
