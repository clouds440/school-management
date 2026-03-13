'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Mail, MessageSquare, Calendar, UserPlus, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { PlatformAdmin, Role } from '@/types';
import { TableActions } from '@/components/ui/TableActions';
import { ModalForm } from '@/components/ui/ModalForm';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';

export default function PlatformAdminsPage() {
    const { user, token, loading } = useAuth();
    const { showToast } = useToast();

    const [platformAdmins, setPlatformAdmins] = useState<PlatformAdmin[]>([]);
    const [fetching, setFetching] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [adminModalMode, setAdminModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [operatingAdmin, setOperatingAdmin] = useState<PlatformAdmin | null>(null);
    const [adminFormData, setAdminFormData] = useState({ name: '', email: '', password: '', phone: '' });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (!loading && user && user.role === Role.SUPER_ADMIN && token) {
            fetchPlatformAdmins();
        }
    }, [loading, user, token]);

    const fetchPlatformAdmins = async () => {
        if (!token) return;
        try {
            setFetching(true);
            const adminData = await api.admin.getPlatformAdmins(token);
            setPlatformAdmins(adminData);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch data';
            showToast(message, 'error');
        } finally {
            setFetching(false);
        }
    };

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
                const newAdmin = await api.admin.createPlatformAdmin(adminFormData, token);
                setPlatformAdmins(prev => [...prev, newAdmin]);
                showToast('Platform Admin created successfully', 'success');
            } else if (operatingAdmin) {
                const updatedAdmin = await api.admin.updatePlatformAdmin(operatingAdmin.id, {
                    name: adminFormData.name,
                    phone: adminFormData.phone,
                    ...(adminFormData.password ? { password: adminFormData.password } : {})
                }, token);
                setPlatformAdmins(prev => prev.map(a => a.id === updatedAdmin.id ? updatedAdmin : a));
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
            setPlatformAdmins(prev => prev.filter(admin => admin.id !== operatingAdmin.id));
            showToast(`${operatingAdmin.name} deleted successfully`, 'success');
            setIsDeleteModalOpen(false);
            setOperatingAdmin(null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to delete admin', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredAdmins = platformAdmins.filter(admin => {
        return admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const columns: Column<PlatformAdmin>[] = [
        {
            header: 'Administrator',
            sortable: true,
            sortAccessor: (row) => row.name,
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
            sortAccessor: (row) => row.email,
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
            sortAccessor: (row) => new Date(row.createdAt).getTime(),
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
                        showViewIcon={false}
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
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl shrink-0">
                        <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight text-left">Platform Admins</h1>
                        <p className="text-gray-500 font-bold opacity-80 mt-1 text-sm md:text-base text-left uppercase tracking-wider">System Administration</p>
                    </div>
                </div>

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
                        onChange={setSearchQuery}
                        placeholder="Search admins by name or email..."
                    />
                </div>

                <div className="p-4 md:p-6 bg-gray-50/10">
                    <DataTable
                        columns={columns}
                        data={filteredAdmins}
                        keyExtractor={(row) => row.id}
                        isLoading={fetching}
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
