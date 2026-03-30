'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, BadgeCheck } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Teacher, Role, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { TableActions } from '@/components/ui/TableActions';
import { usePaginatedData, BasePaginationParams } from '@/hooks/usePaginatedData';
import { getPublicUrl } from '@/lib/utils';
import { Loading } from '@/components/ui/Loading';
import { NewRequestModal } from '@/components/requests/NewRequestModal';
import { Send } from 'lucide-react';

type TeacherParams = BasePaginationParams;

export default function TeachersPage() {
    const { token, user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    // We no longer need local paginatedData state as fetchedData is used directly
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
    const [newRequestOpen, setNewRequestOpen] = useState(false);
    const [initialTargetId, setInitialTargetId] = useState<string | undefined>(undefined);
    const [initialSubject, setInitialSubject] = useState<string | undefined>(undefined);

    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    const teacherParams: TeacherParams = {
        page,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
    };

    const {
        data: fetchedData,
        fetching: isFetching,
        refresh
    } = usePaginatedData<Teacher, TeacherParams>(
        (p) => api.org.getTeachers(token!, p),
        teacherParams,
        `teachers-${user?.orgSlug || pathname.split('/')[1]}`,
        { enabled: !!token }
    );

    useEffect(() => {
        if (user && user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER) {
            const orgSlug = user.orgSlug || pathname.split('/')[1];
            if (user.role === Role.TEACHER) {
                router.replace(`/${orgSlug}/teachers/${user.userName}`);
            } else if (user.role === Role.STUDENT) {
                router.replace(`/${orgSlug}/students/${user.userName}`);
            } else {
                router.replace(`/${orgSlug}`);
            }
        }
    }, [user, router, pathname]);

    const updateQueryParams = (updates: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '') {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // We no longer need fetchData locally as it's handled by the hook

    const handleDeleteConfirm = async () => {
        if (!deletingTeacher || !token) return;
        try {
            await api.org.deleteTeacher(deletingTeacher.id, token);
            showToast('Teacher removed from organization', 'success');
            setDeleteDialogOpen(false);
            refresh();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Failed to delete teacher', 'error');
        }
    };

    const columns: Column<Teacher>[] = [
        {
            header: 'Teacher',
            sortable: true,
            sortKey: 'name',
            accessor: (row: Teacher) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${row.user.avatarUrl ? 'bg-transparent' : 'bg-indigo-50'} rounded-sm flex items-center justify-center text-indigo-600 shrink-0 relative`}>
                        {row.user.avatarUrl ? (
                            <Image src={getPublicUrl(row.user.avatarUrl)} alt={`${row.user.name} photo`} width={40} height={40} className="w-10 h-10 bg-transparent rounded-full object-cover" unoptimized />
                        ) : (
                            row.user.name.charAt(0).toUpperCase()
                        )}
                        {(row.user.role === Role.ORG_ADMIN || row.user.role === Role.ORG_MANAGER) && (
                            <div
                                className={`absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white shadow-sm border ${row.user.role === Role.ORG_ADMIN
                                    ? 'text-amber-500 border-amber-200'
                                    : 'text-blue-500 border-blue-200'
                                    }`}
                                title={row.user.role === Role.ORG_ADMIN ? 'Administrator' : 'Manager'}
                            >
                                <BadgeCheck className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="font-semibold text-card-text">{row.user.name || 'No Name'}</div>
                        <div className="text-sm text-card-text/60">{row.user.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Role & Subject',
            sortable: true,
            sortKey: 'designation',
            accessor: (row: Teacher) => (
                <div className="flex flex-col">
                    <span className="font-medium text-card-text/80">{row.designation || <span className="text-card-text/30 italic">No Designation</span>}</span>
                    <span className="text-sm text-card-text/60">{row.subject || 'No Subject'}</span>
                </div>
            )
        },
        {
            header: 'Assigned Sections',
            sortable: false,
            accessor: (row: Teacher) => {
                const sectionsList = row.sections || [];
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
            header: 'Contact',
            sortable: true,
            sortKey: 'phone',
            accessor: (row: Teacher) => row.user.phone || <span className="text-card-text/30 italic">-</span>
        },
        {
            header: 'Actions',
            accessor: (row: Teacher) => (
                <TableActions
                    onEdit={() => router.push(`/${orgSlug}/teachers/edit/${row.id}`)}
                    onDelete={() => {
                        setDeletingTeacher(row);
                        setDeleteDialogOpen(true);
                    }}
                    variant="user"
                    isViewAndEdit={true}
                    extraActions={[
                        {
                            variant: 'mail',
                            title: 'Send Mail',
                            onClick: () => {
                                setInitialTargetId(row.user.id);
                                setInitialSubject(`Inquiry regarding ${row.user.name}`);
                                setNewRequestOpen(true);
                            }
                        }
                    ]}
                />
            )
        }
    ];

    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    if ((!token && !user) || (isFetching && !fetchedData)) {
        return <Loading fullScreen text="Loading Faculty..." size="lg" />;
    }

    return (
        <div className="flex flex-col w-full animate-fade-in-up">
            <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <Button
                        onClick={() => router.push(`/${orgSlug}/teachers/add`)}
                        icon={UserPlus}
                        className="px-8 py-4"
                    >
                        Add Teacher
                    </Button>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/20 p-2 md:p-4 mb-4 overflow-hidden">
                <div className="mb-4 flex">
                    <SearchBar value={searchTerm} onChange={(val) => updateQueryParams({ search: val, page: 1 })} placeholder="Search by name, email or subject..." />
                </div>

                <DataTable
                    data={fetchedData?.data || []}
                    columns={columns}
                    keyExtractor={(row) => row.id}
                    isLoading={isFetching}
                    onRowClick={(row) => {
                        if (user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) {
                            router.push(`/${orgSlug}/teachers/edit/${row.id}`);
                        }
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

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={<>Remove Faculty Member <strong>{deletingTeacher?.user?.name}</strong></>}
                description={<>Are you really sure you want to remove <strong>{deletingTeacher?.user?.email}</strong>? This action is permanent and cannot be reversed.</>}
                confirmText="Permanently Delete"
                isDestructive={true}
            />

            <NewRequestModal
                isOpen={newRequestOpen}
                onClose={() => {
                    setNewRequestOpen(false);
                    setInitialTargetId(undefined);
                    setInitialSubject(undefined);
                }}
                initialTargetId={initialTargetId}
                initialSubject={initialSubject}
                onSuccess={() => {
                    showToast('Mail sent successfully', 'success');
                }}
            />
        </div>
    );
}
