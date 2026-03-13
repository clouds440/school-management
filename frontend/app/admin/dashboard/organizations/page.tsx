'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldOff, ShieldAlert, ShieldCheck, Building2, MapPin, Mail, Calendar, LucideIcon, Tag, Phone, Info, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import { Organization, AdminStats, OrgStatus, Role } from '@/types';
import { TableActions, AdminAction } from '@/components/ui/TableActions';
import { ModalForm } from '@/components/ui/ModalForm';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';
import { DataField, useUI } from '@/context/UIContext';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';

export default function OrganizationsPage() {
    const { user, token, loading } = useAuth();
    const { showToast } = useToast();

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const { openViewModal } = useUI();
    const [fetching, setFetching] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeStatusTab, setActiveStatusTab] = useState<OrgStatus>(OrgStatus.PENDING);
    const [searchQuery, setSearchQuery] = useState('');
    const [orgTypeFilter, setOrgTypeFilter] = useState<string>('ALL');
    const [stats, setStats] = useState<AdminStats | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [operatingOrg, setOperatingOrg] = useState<{ id: string, name: string, email: string, statusMessage?: string } | null>(null);
    const [modalMode, setModalMode] = useState<'REJECT' | 'SUSPEND' | 'EDIT_MESSAGE'>('REJECT');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!loading && user && (user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) && token) {
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

    const handleOpenModal = (id: string, name: string, email: string, mode: 'REJECT' | 'SUSPEND' | 'EDIT_MESSAGE', currentMessage?: string) => {
        setOperatingOrg({ id, name, email, statusMessage: currentMessage });
        setModalMode(mode);
        setReason(currentMessage || '');
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
                setOrganizations(prev => prev.filter(org => org.id !== operatingOrg.id));
            } else if (modalMode === 'SUSPEND') {
                await api.admin.suspendOrganization(operatingOrg.id, reason, token);
                showToast(`${operatingOrg.name} suspended`, 'info');
                setOrganizations(prev => prev.filter(org => org.id !== operatingOrg.id));
            } else {
                if (activeStatusTab === OrgStatus.REJECTED) {
                    await api.admin.rejectOrganization(operatingOrg.id, reason, token);
                } else {
                    await api.admin.suspendOrganization(operatingOrg.id, reason, token);
                }
                showToast(`Status message updated for ${operatingOrg.name}`, 'success');
                setOrganizations(prev => prev.map(org => org.id === operatingOrg.id ? { ...org, statusMessage: reason } : org));
            }
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

    const statusTabs: { id: OrgStatus, label: string, icon: LucideIcon, color: string, bg: string, count?: number }[] = [
        { id: OrgStatus.PENDING, label: 'Pending', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-600/10', count: stats?.PENDING },
        { id: OrgStatus.APPROVED, label: 'Approved', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-600/10', count: stats?.APPROVED },
        { id: OrgStatus.REJECTED, label: 'Rejected', icon: ShieldOff, color: 'text-red-600', bg: 'bg-red-600/10', count: stats?.REJECTED },
        { id: OrgStatus.SUSPENDED, label: 'Suspended', icon: ShieldAlert, color: 'text-gray-600', bg: 'bg-gray-600/10', count: stats?.SUSPENDED },
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
                        <h4 className="text-sm font-black text-gray-900 leading-tight">{row.name}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{row.type.replace('_', ' ')}</span>
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
            accessor: (row: Organization) => {
                const getActions = (): AdminAction[] => {
                    const actions: AdminAction[] = [];

                    if (activeStatusTab === OrgStatus.PENDING) {
                        actions.push({
                            variant: 'approve',
                            onClick: () => handleApprove(row.id, row.name),
                            loading: actionLoading === `approve-${row.id}`
                        });
                        actions.push({
                            variant: 'reject',
                            onClick: () => handleOpenModal(row.id, row.name, row.email, 'REJECT'),
                            loading: actionLoading === `reject-${row.id}`
                        });
                    } else if (activeStatusTab === OrgStatus.APPROVED) {
                        actions.push({
                            variant: 'suspend',
                            onClick: () => handleOpenModal(row.id, row.name, row.email, 'SUSPEND'),
                            loading: actionLoading === `suspend-${row.id}`
                        });
                    } else if (activeStatusTab === OrgStatus.REJECTED) {
                        actions.push({
                            variant: 'reapprove',
                            onClick: () => handleApprove(row.id, row.name),
                            loading: actionLoading === `approve-${row.id}`,
                            title: 'Re-approve'
                        });
                    } else if (activeStatusTab === OrgStatus.SUSPENDED) {
                        actions.push({
                            variant: 'unsuspend',
                            onClick: () => handleApprove(row.id, row.name),
                            loading: actionLoading === `approve-${row.id}`,
                            title: 'Unsuspend'
                        });
                    }

                    if (row.status === OrgStatus.REJECTED || row.status === OrgStatus.SUSPENDED) {
                        actions.push({
                            variant: 'editMessage',
                            onClick: () => handleOpenModal(row.id, row.name, row.email, 'EDIT_MESSAGE', row.statusMessage),
                            title: 'Edit Status Message'
                        });
                    }

                    return actions;
                };

                return (
                    <div className="flex flex-col gap-1 shrink-0 items-end">
                        <TableActions extraActions={getActions()} />
                        {activeStatusTab === OrgStatus.APPROVED && (
                            <div className="px-2 py-0.5 bg-green-50 text-green-700 rounded-sm font-bold text-[9px] border border-green-100 uppercase">
                                Active
                            </div>
                        )}
                    </div>
                );
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

    const handleViewOrg = (org: Organization) => {
        const viewFields: DataField[] = [
            { label: 'Organization ID', value: org.id, icon: Hash, fullWidth: true },
            { label: 'Organization Name', value: org.name, icon: Building2 },
            { label: 'Location', value: org.location, icon: MapPin },
            { label: 'Type', value: org.type, icon: Tag },
            { label: 'Contact Email', value: org.email, icon: Mail },
            { label: 'Phone Number', value: org.phone || 'N/A', icon: Phone },
            { label: 'Created At', value: new Date(org.createdAt).toLocaleString(), icon: Calendar },
            {
                label: 'Status Message',
                value: org.statusMessage ? <MarkdownRenderer content={org.statusMessage} className="text-sm bg-gray-50 p-4 rounded-sm border border-gray-100 min-h-[100px]" /> : 'N/A',
                icon: Info,
                fullWidth: true
            },
        ];

        openViewModal({
            title: "Organization Details",
            subtitle: org.name || 'Entity Information',
            fields: viewFields
        });
    };

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
                                className={`px-5 py-2.5 rounded-sm font-bold text-sm cursor-pointer transition-all flex items-center gap-2 shadow-sm border whitespace-nowrap ${activeStatusTab === tab.id
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
                        onRowClick={handleViewOrg}
                    />
                </div>
            </div>

            <ModalForm
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setOperatingOrg(null);
                    setReason('');
                }}
                onSubmit={handleModalSubmit}
                title={modalMode === 'REJECT' ? `Reject ${operatingOrg?.name}` : modalMode === 'SUSPEND' ? `Suspend ${operatingOrg?.name}` : 'Edit Status Message'}
                submitText={modalMode === 'REJECT' ? 'Confirm Rejection' : modalMode === 'SUSPEND' ? 'Confirm Suspension' : 'Update Message'}
                variant={modalMode === 'REJECT' ? 'danger' : modalMode === 'SUSPEND' ? 'warning' : 'info'}
                isSubmitting={actionLoading !== null}
                maxWidth="max-w-3xl"
            >
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-gray-500 font-medium">
                        {modalMode === 'EDIT_MESSAGE'
                            ? 'Update the administrative notice for this organization. They will see this message on their dashboard.'
                            : `Please provide a detailed reason for ${modalMode === 'REJECT' ? 'rejecting' : 'suspending'} this organization. This will be shown to the organization administrators.`
                        }
                    </p>
                    <MarkdownEditor
                        value={reason}
                        onChange={setReason}
                        placeholder={`Enter ${modalMode === 'EDIT_MESSAGE' ? 'new status message' : 'reason for ' + modalMode?.toLowerCase()}...`}
                        rows={10}
                        orgData={{
                            name: operatingOrg?.name || '',
                            id: operatingOrg?.id || '',
                            email: operatingOrg?.email || '',
                            admin: user?.name || 'Platform Administrator',
                            role: user?.role || 'Administrator',
                            date: new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
                            signature: 'EduManage @ Support Team'
                        }}
                        templates={[
                            {
                                label: 'Violation of Terms',
                                content: '# Access Suspended\n\nDear Admin of **{{name}}**,\n\nWe are writing to inform you that your organization\'s access has been suspended due to a **violation of our Terms of Service**.\n\nSpecifically: [Enter violation details here]\n\n**Organization ID:** {{id}}'
                            },
                            {
                                label: 'Missing Required Info',
                                content: '# Information Required\n\nYour application for **{{name}}** is currently on hold as some **critical information is missing**.\n\nPlease provide: \n1. [Item 1]\n2. [Item 2]\n\nSubmit the missing documents via your settings page to proceed.'
                            },
                            {
                                label: 'Identity Verification',
                                content: '# Verification Required\n\nTo ensure the security of our platform, we require **further identity verification** for **{{name}}**.\n\nPlease upload a valid institutional certificate or government-issued document showing your organization\'s status.'
                            },
                            {
                                label: 'Suspect Unusual Activity',
                                content: '# Security Notice\n\nDear **{{name}}**,\n\nOur system has detected **suspicious activity** originating from your account. As a security precaution, we have temporarily restricted access.\n\nDetails: [Enter details here]\n\n**ID Reference:** {{id}}'
                            },
                            {
                                label: 'Unauthorized Access Detected',
                                content: '# Unauthorized Access Warning\n\nDear **{{name}}**,\n\nWe have detected **unauthorized access attempts** to your organization dashboard. To protect your data, we have suspended the account.\n\nPlease contact support to verify your identity.'
                            },
                            {
                                label: 'Policy Compliance Check',
                                content: '# Compliance Notice\n\nYour organization **{{name}}** is currently under a **routine policy compliance check**.\n\nThis is a standard procedure and usually takes 2-3 business days. No further action is required from your side at this moment.'
                            }
                        ]}
                    />
                </div>
            </ModalForm>
        </div>
    );
}
