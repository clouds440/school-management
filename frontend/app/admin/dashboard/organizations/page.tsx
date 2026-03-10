'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ShieldCheck, ShieldOff, Search, Check, X, Building2, MapPin, Mail, Calendar, MessageSquare } from 'lucide-react';
import { api, Organization, AdminStats, OrgStatus } from '@/src/lib/api';
import { ModalForm } from '@/components/ui/ModalForm';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';

export default function OrganizationsPage() {
    const { user, token, loading } = useAuth();
    const { showToast } = useToast();

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [fetching, setFetching] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeStatusTab, setActiveStatusTab] = useState<OrgStatus>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [orgTypeFilter, setOrgTypeFilter] = useState<string>('ALL');
    const [stats, setStats] = useState<AdminStats | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [operatingOrg, setOperatingOrg] = useState<{ id: string, name: string } | null>(null);
    const [modalMode, setModalMode] = useState<'REJECT' | 'SUSPEND'>('REJECT');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!loading && user && (user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN') && token) {
            fetchOrganizations();
            api.admin.getAdminStats(token).then(setStats).catch(console.error);
        }
    }, [loading, user, activeStatusTab, token]);

    const fetchOrganizations = async () => {
        if (!token) return;
        try {
            setFetching(true);
            const orgData = await api.admin.getOrganizations(token, activeStatusTab);
            setOrganizations(orgData);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch data';
            showToast(message, 'error');
        } finally {
            setFetching(false);
        }
    };

    const handleApprove = async (id: string, name: string) => {
        if (!token) return;
        try {
            setActionLoading(`approve-${id}`);
            await api.admin.approveOrganization(id, token);
            showToast(`${name} approved successfully`, 'success');
            setOrganizations(prev => prev.filter(org => org.id !== id));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to approve organization';
            showToast(message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleOpenModal = (id: string, name: string, mode: 'REJECT' | 'SUSPEND') => {
        setOperatingOrg({ id, name });
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!operatingOrg || !token) return;

        try {
            setActionLoading(`${modalMode.toLowerCase()}-${operatingOrg.id}`);
            if (modalMode === 'REJECT') {
                await api.admin.rejectOrganization(operatingOrg.id, reason, token);
                showToast(`${operatingOrg.name} rejected`, 'info');
            } else {
                await api.admin.suspendOrganization(operatingOrg.id, reason, token);
                showToast(`${operatingOrg.name} suspended`, 'info');
            }

            setOrganizations(prev => prev.filter(org => org.id !== operatingOrg.id));
            setIsModalOpen(false);
            setOperatingOrg(null);
            setReason('');
        } catch (error) {
            const message = error instanceof Error ? error.message : `Failed to ${modalMode.toLowerCase()} organization`;
            showToast(message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredOrganizations = organizations.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = orgTypeFilter === 'ALL' || org.type === orgTypeFilter;
        return matchesSearch && matchesType;
    });

    const statusTabs: { id: OrgStatus, label: string, icon: any, color: string, bg: string, count?: number }[] = [
        { id: 'PENDING', label: 'Pending', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-600/10', count: stats?.PENDING },
        { id: 'APPROVED', label: 'Approved', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-600/10', count: stats?.APPROVED },
        { id: 'REJECTED', label: 'Rejected', icon: ShieldOff, color: 'text-red-600', bg: 'bg-red-600/10', count: stats?.REJECTED },
        { id: 'SUSPENDED', label: 'Suspended', icon: ShieldAlert, color: 'text-gray-600', bg: 'bg-gray-600/10', count: stats?.SUSPENDED },
    ];

    const columns: Column<Organization>[] = [
        {
            header: 'Organization',
            sortable: true,
            sortAccessor: (row) => row.name,
            accessor: (row) => (
                <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 rounded-sm flex items-center justify-center text-indigo-600 shrink-0">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-gray-900 leading-tight wrap-break-word">{row.name}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block truncate">{row.type.replace('_', ' ')}</span>
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
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        {row.location}
                    </div>
                    <div className="flex items-center text-xs font-medium text-gray-600 gap-1.5">
                        <Mail className="w-3 h-3 text-indigo-400" />
                        {row.email}
                    </div>
                </div>
            )
        },
        {
            header: 'Created On',
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
            accessor: (row) => (
                <div className="flex flex-col gap-2 shrink-0 sm:items-end w-32">
                    {activeStatusTab === 'PENDING' ? (
                        <>
                            <button
                                onClick={() => handleApprove(row.id, row.name)}
                                disabled={actionLoading !== null}
                                className="w-full px-3 py-2 bg-green-600 text-white rounded-sm font-bold text-xs shadow-md shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-1.5"
                            >
                                {actionLoading === `approve-${row.id}` ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                ) : <Check className="w-3 h-3" />}
                                Approve
                            </button>
                            <button
                                onClick={() => handleOpenModal(row.id, row.name, 'REJECT')}
                                disabled={actionLoading !== null}
                                className="w-full px-3 py-2 bg-white text-red-600 border border-red-100 rounded-sm font-bold text-xs hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                            >
                                <X className="w-3 h-3" />
                                Reject
                            </button>
                        </>
                    ) : activeStatusTab === 'APPROVED' ? (
                        <div className="flex flex-col gap-2 w-full">
                            <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-sm font-bold text-[10px] flex justify-center items-center gap-1 border border-green-100">
                                <ShieldCheck className="w-3 h-3" />
                                ACTIVE
                            </div>
                            <button
                                onClick={() => handleOpenModal(row.id, row.name, 'SUSPEND')}
                                disabled={actionLoading !== null}
                                className="w-full px-3 py-2 bg-white text-orange-600 border border-orange-100 rounded-sm font-bold text-xs hover:bg-orange-50 transition-all flex items-center justify-center gap-1.5"
                            >
                                <ShieldAlert className="w-3 h-3" />
                                Suspend
                            </button>
                        </div>
                    ) : activeStatusTab === 'REJECTED' ? (
                        <>
                            <button
                                onClick={() => handleApprove(row.id, row.name)}
                                disabled={actionLoading !== null}
                                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-sm font-bold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5"
                            >
                                {actionLoading === `approve-${row.id}` ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                ) : <Check className="w-3 h-3" />}
                                Re-approve
                            </button>
                            {row.statusMessage && (
                                <div className="text-[10px] text-red-500 italic mt-1 wrap-break-word w-full text-right">
                                    "{row.statusMessage}"
                                </div>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => handleApprove(row.id, row.name)}
                            disabled={actionLoading !== null}
                            className="w-full px-3 py-2 bg-indigo-600 text-white rounded-sm font-bold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5"
                        >
                            {actionLoading === `approve-${row.id}` ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                            ) : <Check className="w-3 h-3" />}
                            Unsuspend
                        </button>
                    )}
                </div>
            )
        }
    ];

    if (loading || (!user && !loading)) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl shrink-0">
                        <Building2 className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight text-left">Organizations</h1>
                        <p className="text-gray-500 font-bold opacity-80 mt-1 text-sm md:text-base text-left uppercase tracking-wider">Management & Verification</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/50 flex flex-col w-full overflow-hidden">
                <div className="px-6 md:px-8 pt-8 pb-6 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-gray-50/50">
                    <div className="flex overflow-x-auto mb-4 xl:mb-0 pb-2 gap-3 scrollbar-none sm:flex-wrap">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveStatusTab(tab.id)}
                                className={`px-5 py-2.5 rounded-sm font-bold text-sm transition-all flex items-center gap-2 shadow-sm border whitespace-nowrap ${activeStatusTab === tab.id
                                    ? 'bg-white border-gray-200 text-gray-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
                                    : 'bg-gray-100/50 border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeStatusTab === tab.id ? tab.color : 'opacity-40'}`} />
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter transition-all ${activeStatusTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto px-2">
                        <select
                            value={orgTypeFilter}
                            onChange={(e) => setOrgTypeFilter(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-sm bg-white border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm min-w-[160px]"
                        >
                            <option value="ALL">All Org Types</option>
                            <option value="HIGH_SCHOOL">High School</option>
                            <option value="UNIVERSITY">University</option>
                            <option value="PRIMARY_SCHOOL">Primary School</option>
                            <option value="OTHER">Other</option>
                        </select>

                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search organizations..."
                        />
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-gray-50/10">
                    <DataTable
                        columns={columns}
                        data={filteredOrganizations}
                        keyExtractor={(row) => row.id}
                        isLoading={fetching}
                    />
                </div>
            </div>

            <ModalForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                title={modalMode === 'REJECT' ? `Reject ${operatingOrg?.name}` : `Suspend ${operatingOrg?.name}`}
                submitText={modalMode === 'REJECT' ? 'Confirm Rejection' : 'Confirm Suspension'}
                variant={modalMode === 'REJECT' ? 'danger' : 'warning'}
                isSubmitting={actionLoading !== null}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 font-medium">
                        {modalMode === 'REJECT'
                            ? "Please provide a reason for rejecting this organization. They will see this message."
                            : "Please provide a reason for suspending this organization. They will see this message and their access will be restricted."
                        }
                    </p>
                    <textarea
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Type the reason here..."
                        className="w-full h-32 px-4 py-3 rounded-sm bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 font-medium"
                    />
                </div>
            </ModalForm>
        </div>
    );
}
