'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Role, Student, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { TableActions } from '@/components/ui/TableActions';
import { usePaginatedData, BasePaginationParams } from '@/hooks/usePaginatedData';

interface StudentParams extends BasePaginationParams {
    my?: boolean;
}

export default function StudentsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];
    const { showToast } = useToast();

    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Student> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
    const showOnlyMyStudents = searchParams.get('my') === 'true';

    const studentParams: StudentParams = {
        page,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        my: showOnlyMyStudents
    };

    const { 
        data: fetchedData, 
        loading: isInitialLoading, 
        fetching: isFetching, 
        refresh 
    } = usePaginatedData<Student, StudentParams>(
        (p) => api.org.getStudents(token!, p),
        studentParams,
        `students-${orgSlug}`
    );

    useEffect(() => {
        setPaginatedData(fetchedData);
    }, [fetchedData]);

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

    // We no longer need fetchStudents locally as it's handled by the hook

    const students = paginatedData?.data || [];
    
    // Client-side filter for "My Students" if not handled by server
    const filteredStudents = students.filter((student: Student) => {
        if (!showOnlyMyStudents) return true;
        
        const loggedInUserId = user?.sub || user?.id;
        return student.enrollments?.some(e =>
            e.section?.teachers?.some(t => t.userId === loggedInUserId)
        );
    });

    const columns: Column<Student>[] = [
        {
            header: 'Student Name',
            sortable: true,
            sortKey: 'name',
            accessor: (row: Student) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        {(row.user.name || 'N').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-card-text">{row.user.name || 'N/A'}</span>
                </div>
            )
        },
        {
            header: 'Reg No.',
            sortable: true,
            sortKey: 'registrationNumber',
            accessor: (row: Student) => row.registrationNumber || '-'
        },
        {
            header: 'Major / Course',
            sortable: true,
            sortKey: 'major',
            accessor: (row: Student) => row.major || '-'
        },
        {
            header: 'Contact',
            sortable: true,
            sortKey: 'email',
            accessor: (row: Student) => (
                <div className="flex flex-col">
                    <span className="text-card-text/80">{row.user.phone || 'No phone'}</span>
                    <span className="text-xs text-card-text/40">{row.user.email}</span>
                </div>
            )
        },
        {
            header: 'Enrolled Sections',
            sortable: false,
            accessor: (row: Student) => {
                const sectionsList = row.enrollments?.map(e => e.section) || [];
                return sectionsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {sectionsList.map(sec => (
                            <span key={sec?.id || Math.random()} className="bg-primary/5 text-primary px-2 py-1 rounded-sm text-xs font-medium border border-primary/10 truncate max-w-[150px]" title={sec?.name}>
                                {sec?.name || 'Unknown'}
                            </span>
                        ))}
                    </div>
                ) : <span className="text-card-text/30 italic">Unassigned</span>;
            }
        },
        {
            header: 'Fee',
            sortable: true,
            sortKey: 'fee',
            accessor: (row: Student) => (
                <div className="whitespace-nowrap">
                    {row.fee ? `$${row.fee}` : '-'}
                </div>
            )
        },
        {
            header: 'Last Updated',
            sortable: true,
            sortKey: 'updatedAt',
            accessor: (row: Student) => row.updatedBy ? (
                <div className="flex flex-col whitespace-nowrap">
                    <span className="font-medium text-gray-800">{row.updatedBy}</span>
                    <span className="text-xs text-gray-500">{new Date(row.updatedAt || '').toLocaleDateString()}</span>
                </div>
            ) : <span className="text-card-text/30 italic text-sm text-center">Never</span>
        },
        {
            header: 'Actions',
            accessor: (row: Student) => (user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER || user?.role === Role.TEACHER) ? (
                <TableActions
                    onEdit={() => router.push(`/${orgSlug}/dashboard/students/edit/${row.id}`)}
                    onDelete={() => handleDeleteClick(row.id)}
                    variant="user"
                    isViewAndEdit={true}
                />
            ) : null
        }
    ];

    const handleDeleteClick = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (student) {
            setSelectedStudent(student);
            setIsDeleteDialogOpen(true);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedStudent || !token) return;
        try {
            await api.org.deleteStudent(selectedStudent.id, token);
            showToast('Student removed successfully', 'success');
            setIsDeleteDialogOpen(false);
            refresh();
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Failed to delete student', 'error');
        }
    };

    if ((!token && !user) || (isFetching && !paginatedData)) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                {(user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER || user?.role === Role.TEACHER) && (
                    <Button
                        onClick={() => router.push(`/${orgSlug}/dashboard/students/add`)}
                        icon={Plus}
                        className="px-8 py-4 w-full md:w-auto"
                    >
                        Add New Student
                    </Button>
                )}
            </div>

            <div className="bg-card text-card-text rounded-sm md:rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-white/20 p-4 md:p-8 mb-10 overflow-hidden">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                    <div className="flex-1 max-w-xl">
                        <SearchBar value={searchTerm} onChange={(val) => updateQueryParams({ search: val, page: 1 })} placeholder="Search by name, registration or major..." />
                    </div>

                    {user?.role === 'TEACHER' && (
                        <div className="flex items-center gap-3 bg-primary/5 p-2 pr-4 rounded-sm border border-primary/10 self-start md:self-auto">
                            <button
                                onClick={() => updateQueryParams({ my: !showOnlyMyStudents, page: 1 })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${showOnlyMyStudents ? 'bg-primary' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOnlyMyStudents ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className="text-xs font-bold text-card-text uppercase tracking-wider">My Students</span>
                        </div>
                    )}
                </div>

                <div className="relative overflow-x-hidden">
                    <DataTable
                        data={filteredStudents}
                        columns={columns}
                        keyExtractor={(row) => row.id}
                        isLoading={isFetching}
                        onRowClick={(row) => {
                            if (user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) {
                                router.push(`/${orgSlug}/dashboard/students/edit/${row.id}`);
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

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={<>Remove Student <strong>{selectedStudent?.user?.name}</strong></>}
                description={<>Are you sure you want to completely remove <strong>{selectedStudent?.user?.name || 'this student'}</strong>? This will also delete their login account.</>}
                confirmText="Yes, Remove Student"
                isDestructive={true}
            />
        </div>
    );
}
