'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { CustomSelect } from '@/components/ui/CustomSelect';
import { usePaginatedData, BasePaginationParams } from '@/hooks/usePaginatedData';
import { getPublicUrl } from '@/lib/utils';

interface StudentParams extends BasePaginationParams {
    my?: boolean;
    sectionId?: string;
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
    const [sections, setSections] = useState<any[]>([]);

    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
    const showOnlyMyStudents = searchParams.get('my') === 'true';
    const sectionId = searchParams.get('sectionId') || '';

    const studentParams: StudentParams = {
        page,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        my: user?.role === Role.TEACHER ? true : showOnlyMyStudents,
        sectionId: sectionId || undefined
    };

    const {
        data: fetchedData,
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

    useEffect(() => {
        if (user && user.role === Role.STUDENT) {
            router.replace(`/${orgSlug}/students/${user.userName}`);
        }
    }, [user, orgSlug, router]);

    useEffect(() => {
        if (token && (user?.role === Role.TEACHER || user?.role === Role.ORG_MANAGER)) {
            api.org.getSections(token, { my: user.role === Role.TEACHER, limit: 100 }).then(res => {
                setSections(res.data);
            }).catch(err => console.error('Failed to fetch sections:', err));
        }
    }, [token, user]);

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

    const students = paginatedData?.data || [];

    const columns: Column<Student>[] = [
        {
            header: 'Student Name',
            sortable: true,
            sortKey: 'name',
            accessor: (row: Student) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${row.user.avatarUrl ? 'bg-transparent' : 'bg-indigo-50'} rounded-sm flex items-center justify-center text-indigo-600 shrink-0`}>
                        {row.user.avatarUrl ? (
                            <Image src={getPublicUrl(row.user.avatarUrl)} alt="Student photo" width={40} height={40} className="w-10 h-10 bg-transparent rounded-full object-cover" unoptimized />
                        ) : (
                            row.user.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <span className="font-semibold text-card-text">{row.user.name || 'N/A'}</span>
                </div>
            )
        },
        {
            header: 'Reg / Roll No.',
            sortable: true,
            sortKey: 'registrationNumber',
            accessor: (row: Student) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-card-text">{row.registrationNumber || '-'}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-card-text/40 leading-none mt-1">
                        Roll: {row.rollNumber || '-'}
                    </span>
                </div>
            )
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
            accessor: (row: Student) => {
                const isManagerOrAdmin = user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER;
                return (
                    <TableActions
                        onEdit={isManagerOrAdmin ? () => router.push(`/${orgSlug}/students/edit/${row.id}`) : undefined}
                        onDelete={isManagerOrAdmin ? () => handleDeleteClick(row.id) : undefined}
                        variant="user"
                        isViewAndEdit={isManagerOrAdmin}
                        extraActions={[
                            {
                                variant: 'unsuspend',
                                onClick: () => router.push(`/${orgSlug}/students/${row.user.userName}`),
                                title: 'View Portal'
                            }
                        ]}
                    />
                );
            }
        }
    ];

    const handleDeleteClick = (studentId: string) => {
        const student = students.find((s: Student) => s.id === studentId);
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
        <div className="flex flex-col w-full animate-fade-in-up">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {(user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) && (
                    <Button
                        onClick={() => router.push(`/${orgSlug}/students/add`)}
                        icon={Plus}
                        className="px-8 py-4 w-full md:w-auto"
                    >
                        Add New Student
                    </Button>
                )}
            </div>

            <div className="bg-card text-card-text rounded-sm md:rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-white/20 p-4 md:p-8 mb-10 overflow-hidden">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 max-w-xl">
                        <SearchBar value={searchTerm} onChange={(val) => updateQueryParams({ search: val, page: 1 })} placeholder="Search by name, reg, roll or major..." />
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {(user?.role === Role.TEACHER || user?.role === Role.ORG_MANAGER) && (
                            <div className="flex items-center gap-2 min-w-[200px]">
                                <span className="text-xs font-bold text-card-text/40 uppercase tracking-wider whitespace-nowrap">Section:</span>
                                <CustomSelect
                                    value={sectionId}
                                    onChange={(val) => updateQueryParams({ sectionId: val, page: 1 })}
                                    options={[
                                        { value: '', label: 'All My Sections' },
                                        ...sections.map(sec => ({ value: sec.id, label: sec.name }))
                                    ]}
                                    placeholder="All My Sections"
                                    className="flex-1 px-3"
                                />
                            </div>
                        )}

                        {user?.role === Role.ORG_MANAGER && (
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
                </div>

                <div className="relative overflow-x-hidden">
                    <DataTable
                        data={students}
                        columns={columns}
                        keyExtractor={(row) => row.id}
                        isLoading={isFetching}
                        onRowClick={(row) => {
                            if (user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) {
                                router.push(`/${orgSlug}/students/edit/${row.id}`);
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
