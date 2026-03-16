'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Users, Mail, MessageSquare, Calendar, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { PlatformAdmin, Role, PaginatedResponse } from '@/types';
import { TableActions } from '@/components/ui/TableActions';
import { ModalForm } from '@/components/ui/ModalForm';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';
import { usePaginatedData, BasePaginationParams } from '@/hooks/usePaginatedData';

interface PlatformAdminParams extends BasePaginationParams {}

export default function PlatformAdminsPage() {
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { showToast } = useToast();

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<PlatformAdmin> | null>(null);
    
    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchQuery = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    const adminParams: PlatformAdminParams = {
        page,
        limit: 10,
        search: searchQuery,
        sortBy,
        sortOrder,
    };

    const { 
        data: fetchedData, 
        loading: isInitialLoading, 
        fetching, 
        refresh 
    } = usePaginatedData<PlatformAdmin, PlatformAdminParams>(
        (p) => api.admin.getPlatformAdmins(token!, p),
        adminParams,
        'platform-admins'
    );

    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [adminModalMode, setAdminModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [operatingAdmin, setOperatingAdmin] = useState<PlatformAdmin | null>(null);
    const [adminFormData, setAdminFormData] = useState({ name: '', email: '', password: '', phone: '' });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        setPaginatedData(fetchedData);
    }, [fetchedData]);

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

    // We no longer need fetchPlatformAdmins locally as it's handled by the hook

    const handleOpenAdminModal = (mode: 'CREATE' | 'EDIT', admin: PlatformAdmin | null = null) => {
        setAdminModalMode(mode);
        setOperatingAdmin(admin);
        if (mode === 'EDIT' && admin) {
            setAdminFormData({ name: admin.name, email: admin.email, password: '', phone: admin.phone || '' });
        } else {
            setAdminFormData({ name: '', email: '', password: '', phone: '' });
        }
        setIsAdminModalOpen(true);
    };

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            setActionLoading('admin-save');
            if (adminModalMode === 'CREATE') {
                await api.admin.createPlatformAdmin(adminFormData, token);
                refresh();
                showToast('Platform Admin created successfully', 'success');
            } else if (operatingAdmin) {
                await api.admin.updatePlatformAdmin(operatingAdmin.id, {
                    name: adminFormData.name,
                    phone: adminFormData.phone,
                    ...(adminFormData.password ? { password: adminFormData.password } : {})
                }, token);
                refresh();
                showToast('Platform Admin updated successfully', 'success');
            }
            setIsAdminModalOpen(false);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to save admin', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteAdmin = (admin: PlatformAdmin) => {
        setOperatingAdmin(admin);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!operatingAdmin || !token) return;

        try {
            setActionLoading(`delete-${operatingAdmin.id}`);
            await api.admin.deletePlatformAdmin(operatingAdmin.id, token);
            refresh();
            showToast(`${operatingAdmin.name} deleted successfully`, 'success');
            setIsDeleteModalOpen(false);
            setOperatingAdmin(null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to delete admin', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const platformAdmins = paginatedData?.data || [];

    const columns: Column<PlatformAdmin>[] = [
        {
            header: 'Administrator',
            sortable: true,
            sortKey: 'name',
            accessor: (row) => (
                <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 bg-purple-50 rounded-sm flex items-center justify-center text-purple-600 shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-gray-900 leading-tight wrap-break-word">{row.name}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">{row.role.replace('_', ' ')}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Contact Info',
            sortable: true,
            sortKey: 'email',
            accessor: (row) => (
                <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-gray-600 gap-1.5">
                        <Mail className="w-3 h-3 text-purple-400" />
                        {row.email}
                    </div>
                    {row.phone && (
                        <div className="flex items-center text-xs font-medium text-gray-600 gap-1.5">
                            <MessageSquare className="w-3 h-3 text-purple-400" />
                            {row.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Added On',
            sortable: true,
            sortKey: 'createdAt',
            accessor: (row) => (
                <div className="flex items-center text-xs font-medium text-gray-500 gap-1.5 opacity-80">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            )
        },
        {
            header: 'Actions',
            accessor: (row) => {
                if (row.id === user?.id) return <span className="text-xs text-gray-400 italic">Current User</span>;
                return (
                    <TableActions
                        onEdit={() => handleOpenAdminModal('EDIT', row)}
                        onDelete={() => handleDeleteAdmin(row)}
                        isDeleting={actionLoading === `delete-${row.id}`}
                        isViewAndEdit={true}
                        variant="user"
                    />
                )
            }
        }
    ];

    if (loading || (!user && !loading)) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (user?.role !== 'SUPER_ADMIN') {
        return <div className="p-8 text-center text-gray-500">Access Restricted</div>;
    }

    return (
        <div className="flex flex-col py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <button
                    onClick={() => handleOpenAdminModal('CREATE')}
                    className="px-6 py-3 rounded-sm bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 w-full sm:w-auto"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Admin
                </button>
            </div>

            <div className="bg-white/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/50 flex flex-col w-full overflow-hidden">
                <div className="px-8 pt-6 pb-6 border-b border-gray-100 flex flex-col gap-6 bg-gray-50/50">
                    <SearchBar
                        value={searchQuery}
                        onChange={(val) => updateQueryParams({ search: val, page: 1 })}
                        placeholder="Search admins by name or email..."
                    />
                </div>

                <div className="p-4 md:p-6 bg-gray-50/10">
                    <DataTable
                        columns={columns}
                        data={platformAdmins}
                        keyExtractor={(row) => row.id}
                        isLoading={fetching}
                        currentPage={paginatedData?.currentPage || 1}
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
                isOpen={isAdminModalOpen}
                onClose={() => setIsAdminModalOpen(false)}
                onSubmit={handleAdminSubmit}
                title={adminModalMode === 'CREATE' ? 'Add New Platform Admin' : `Edit ${operatingAdmin?.name}`}
                submitText={adminModalMode === 'CREATE' ? 'Create Admin' : 'Save Changes'}
                isSubmitting={actionLoading === 'admin-save'}
            >
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={adminFormData.name}
                            onChange={e => setAdminFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 rounded-sm bg-gray-50/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-gray-900"
                            placeholder="John Doe"
                        />
                    </div>
                    {adminModalMode === 'CREATE' && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={adminFormData.email}
                                onChange={e => setAdminFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-4 py-3 rounded-sm bg-gray-50/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-gray-900"
                                placeholder="john@example.com"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Phone (Optional)</label>
                        <input
                            type="tel"
                            value={adminFormData.phone}
                            onChange={e => setAdminFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 rounded-sm bg-gray-50/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-gray-900"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">
                            {adminModalMode === 'CREATE' ? 'Password' : 'New Password (Optional)'}
                        </label>
                        <input
                            type="password"
                            required={adminModalMode === 'CREATE'}
                            value={adminFormData.password}
                            onChange={e => setAdminFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full px-4 py-3 rounded-sm bg-gray-50/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-gray-900"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            </ModalForm>

            <ModalForm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onSubmit={handleConfirmDelete}
                title="Confirm Deletion"
                submitText="Permanently Delete"
                variant="danger"
                isSubmitting={actionLoading === `delete-${operatingAdmin?.id}`}
            >
                <div>
                    <p className="text-sm font-medium text-gray-700">
                        Are you sure you want to remove <strong>{operatingAdmin?.name}</strong> from Platform Admins?
                    </p>
                    <p className="text-xs text-red-500 mt-2">This action cannot be undone.</p>
                </div>
            </ModalForm>
        </div>
    );
}
