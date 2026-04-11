'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { ShieldOff, ShieldAlert, ShieldCheck, Building2, MapPin, Mail, Calendar, LucideIcon, Tag, Phone, Info, Hash, Clock, GraduationCap, BookOpen, School, Library, MonitorPlay, Pencil, Send } from 'lucide-react';
import { api } from '@/lib/api';
import statsStore from '@/lib/statsStore';
import { Organization, OrgStatus } from '@/types';
import { getPublicUrl } from '@/lib/utils';
import { TableActions, AdminAction } from '@/components/ui/TableActions';
import { ModalForm } from '@/components/ui/ModalForm';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { DataField, useUI } from '@/context/UIContext';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { usePaginatedData, BasePaginationParams } from '@/hooks/usePaginatedData';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Loading } from '@/components/ui/Loading';
import { NewMailModal } from '@/components/mail/NewMailModal';

interface AdminOrgParams extends BasePaginationParams {
    status: OrgStatus;
    type: string;
}

export default function OrganizationsPage() {
    const { user, token, loading } = useAuth();
    const { state, dispatch } = useGlobal();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { openViewModal } = useUI();
    const actionLoading = state.ui.isProcessing;
    const [processingId, setProcessingId] = useState<string | null>(null);
    const stats = state.stats.admin;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [operatingOrg, setOperatingOrg] = useState<{ id: string, name: string, email: string, adminUserId: string, statusHistory?: Organization['statusHistory'] } | null>(null);
    const [modalMode, setModalMode] = useState<'REJECT' | 'SUSPEND' | 'EDIT_MESSAGE'>('REJECT');
    const [reason, setReason] = useState('');

    const [newMailOpen, setNewMailOpen] = useState(false);
    const [initialTargetId, setInitialTargetId] = useState<string | undefined>(undefined);
    const [initialSubject, setInitialSubject] = useState<string | undefined>(undefined);

    const [pageSize, setPageSize] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('edu-admin-orgs-limit');
            return saved ? parseInt(saved, 10) : 10;
        }
        return 10;
    });

    // URL State
    const orgParams: AdminOrgParams = {
        status: (searchParams.get('status') as OrgStatus) || OrgStatus.PENDING,
        page: parseInt(searchParams.get('page') || '1', 10),
        search: searchParams.get('search') || '',
        sortBy: searchParams.get('sortBy') || 'name',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
        type: searchParams.get('type') || 'ALL',
        limit: pageSize
    };

    const {
        data: fetchedData,
        fetching: isFetching,
        refresh
    } = usePaginatedData<Organization, AdminOrgParams>(
        (p) => api.admin.getOrganizations(token!, p),
        orgParams,
        'admin-organizations',
        { enabled: !!token }
    );

    const activeStatusTab = orgParams.status;
    const page = orgParams.page || 1;
    const searchQuery = orgParams.search || '';
    const sortBy = orgParams.sortBy || 'name';
    const sortOrder = orgParams.sortOrder || 'asc';
    const orgTypeFilter = orgParams.type || 'ALL';

    const updateQueryParams = (updates: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '') {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        localStorage.setItem('edu-admin-orgs-limit', String(newSize));
        updateQueryParams({ page: 1 });
    };

    const handleApprove = async (id: string, name: string) => {
        if (!token) return;
        try {
            setProcessingId(`approve-${id}`);
            dispatch({ type: 'UI_SET_PROCESSING', payload: true });
            await api.admin.approveOrganization(id, token);
            dispatch({ type: 'TOAST_ADD', payload: { message: `${name} approved successfully`, type: 'success' } });
            refresh();
            if (token) {
                statsStore.fetchAll(token).then(({ admin }) => {
                    if (admin) dispatch({ type: 'STATS_SET_ADMIN', payload: admin });
                }).catch(console.error);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to approve organization';
            dispatch({ type: 'TOAST_ADD', payload: { message, type: 'error' } });
        } finally {
            setProcessingId(null);
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleOpenModal = (row: Organization, mode: 'REJECT' | 'SUSPEND' | 'EDIT_MESSAGE') => {
        setOperatingOrg({ id: row.id, name: row.name, email: row.email, adminUserId: row.adminUserId || '', statusHistory: row.statusHistory });
        setModalMode(mode);
        const lastMessage = row.statusHistory && row.statusHistory.length > 0 ? row.statusHistory[row.statusHistory.length - 1].message : '';
        setReason(lastMessage || '');
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!operatingOrg || !token) return;

        try {
            setProcessingId(`${modalMode.toLowerCase()}-${operatingOrg.id}`);
            dispatch({ type: 'UI_SET_PROCESSING', payload: true });
            if (modalMode === 'REJECT') {
                await api.admin.rejectOrganization(operatingOrg.id, reason, token);
                dispatch({ type: 'TOAST_ADD', payload: { message: `${operatingOrg.name} rejected`, type: 'info' } });
                refresh();
            } else if (modalMode === 'SUSPEND') {
                await api.admin.suspendOrganization(operatingOrg.id, reason, token);
                dispatch({ type: 'TOAST_ADD', payload: { message: `${operatingOrg.name} suspended`, type: 'info' } });
                refresh();
            } else {
                if (activeStatusTab === OrgStatus.REJECTED) {
                    await api.admin.rejectOrganization(operatingOrg.id, reason, token);
                } else {
                    await api.admin.suspendOrganization(operatingOrg.id, reason, token);
                }
                dispatch({ type: 'TOAST_ADD', payload: { message: `Status message updated for ${operatingOrg.name}`, type: 'success' } });
                refresh();
            }
            setIsModalOpen(false);
            setOperatingOrg(null);
            setReason('');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : `Failed to ${modalMode.toLowerCase()} organization`;
            dispatch({ type: 'TOAST_ADD', payload: { message, type: 'error' } });
        } finally {
            setProcessingId(null);
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleSendMail = (org: Organization) => {
        setInitialTargetId(org.adminUserId);
        setInitialSubject(`Inquiry regarding ${org.name}`);
        setNewMailOpen(true);
    };

    const dynamicCounts = fetchedData?.counts || stats;

    const statusTabs: { id: OrgStatus, label: string, icon: LucideIcon, color: string, bg: string, count?: number }[] = [
        { id: OrgStatus.PENDING, label: 'Pending', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-600/10', count: dynamicCounts?.PENDING },
        { id: OrgStatus.APPROVED, label: 'Approved', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-600/10', count: dynamicCounts?.APPROVED },
        { id: OrgStatus.REJECTED, label: 'Rejected', icon: ShieldOff, color: 'text-red-600', bg: 'bg-red-600/10', count: dynamicCounts?.REJECTED },
        { id: OrgStatus.SUSPENDED, label: 'Suspended', icon: ShieldAlert, color: 'text-gray-600', bg: 'bg-gray-600/10', count: dynamicCounts?.SUSPENDED },
    ];

    const columns: Column<Organization>[] = [
        {
            header: 'Organization',
            sortable: true,
            sortKey: 'name',
            accessor: (row) => (
                <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-10 h-10 ${row.logoUrl ? 'bg-transparent' : 'bg-card/5'} rounded-sm flex items-center justify-center text-primary shrink-0`}>
                        {row.logoUrl ? (
                            <Image src={getPublicUrl(row.logoUrl)} alt="Org Logo/Icon" width={40} height={40} className="w-10 h-10 bg-transparent rounded-full object-contain" unoptimized />
                        ) : (
                            <Building2 className="w-5 h-5" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-foreground leading-tight">{row.name}</h4>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{row.type.replace('_', ' ')}</span>
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
                    <div className="flex items-center text-xs font-medium text-muted-foreground gap-1.5">
                        <MapPin className="w-3 h-3 text-primary/80" />
                        {row.location || 'N/A'}
                    </div>
                    <div className="flex items-center text-xs font-medium text-muted-foreground gap-1.5">
                        <Mail className="w-3 h-3 text-primary/80" />
                        {row.email || 'N/A'}
                    </div>
                </div>
            )
        },
        {
            header: 'Created On',
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
            width: 250,
            accessor: (row: Organization) => {
                const getActions = (): AdminAction[] => {
                    const actions: AdminAction[] = [];

                    if (activeStatusTab === OrgStatus.PENDING) {
                        actions.push({
                            variant: 'approve',
                            onClick: () => handleApprove(row.id, row.name),
                            loading: actionLoading && processingId === `approve-${row.id}`
                        });
                        actions.push({
                            variant: 'reject',
                            onClick: () => handleOpenModal(row, 'REJECT'),
                            loading: actionLoading && processingId === `reject-${row.id}`
                        });
                    } else if (activeStatusTab === OrgStatus.APPROVED) {
                        actions.push({
                            variant: 'suspend',
                            onClick: () => handleOpenModal(row, 'SUSPEND'),
                            loading: actionLoading && processingId === `suspend-${row.id}`
                        });
                    } else if (activeStatusTab === OrgStatus.REJECTED) {
                        actions.push({
                            variant: 'reapprove',
                            onClick: () => handleApprove(row.id, row.name),
                            loading: actionLoading && processingId === `approve-${row.id}`,
                            title: 'Re-approve'
                        });
                    } else if (activeStatusTab === OrgStatus.SUSPENDED) {
                        actions.push({
                            variant: 'unsuspend',
                            onClick: () => handleApprove(row.id, row.name),
                            loading: actionLoading && processingId === `approve-${row.id}`,
                            title: 'Unsuspend'
                        });
                    }

                    if (row.status === OrgStatus.REJECTED || row.status === OrgStatus.SUSPENDED) {
                        actions.push({
                            variant: 'editMessage',
                            onClick: () => handleOpenModal(row, 'EDIT_MESSAGE'),
                            title: 'Edit Status Message'
                        });
                    }

                    return actions;
                };

                return (
                    <div className="flex flex-col gap-1 shrink-0 items-end">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => handleSendMail(row)}
                                className="py-2 px-3 bg-card/5 hover:bg-card/10 text-muted-foreground hover:text-primary rounded-sm transition-all"
                                title="Send Mail"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                            <TableActions
                                extraActions={getActions()}
                                showLabels={window.innerWidth > 1440}
                            />
                        </div>
                    </div>
                );
            }
        }
    ];

    if ((loading || (!user && !loading)) || (isFetching && !fetchedData)) {
        return <Loading fullScreen text="Loading Organizations..." size="lg" icon={Building2} />;
    }

    const handleViewOrg = (org: Organization) => {
        const viewFields: DataField[] = [
            { label: 'Organization ID', value: org.id, icon: Hash, fullWidth: true },
            { label: 'Organization Name', value: org.name, icon: org.logoUrl ? org.logoUrl : Building2 },
            { label: 'Location', value: org.location, icon: MapPin },
            { label: 'Type', value: org.type, icon: Tag },
            { label: 'Contact Email', value: org.email, icon: Mail },
            { label: 'Phone Number', value: org.phone || 'N/A', icon: Phone },
            { label: 'Created At', value: new Date(org.createdAt).toLocaleString(), icon: Calendar },
            {
                label: 'Status History',
                value: org.statusHistory && org.statusHistory.length > 0 ? (
                    <div className="space-y-4 mt-2 max-h-125 overflow-y-auto pr-6 custom-scrollbar -ml-2">
                        {[...org.statusHistory].reverse().map((entry, idx) => (
                            <div key={idx} className="relative pl-8 border-l-2 border-primary/10 last:border-l-0 pb-8 last:pb-2">
                                <div className="absolute left-2 top-0.5 w-5 h-5 rounded-full bg-card border-4 border-primary/20 flex items-center justify-center shadow-sm">
                                    <div className={`w-2 h-2 rounded-full ${entry.status === 'APPROVED' ? 'bg-green-500' :
                                        entry.status === 'REJECTED' ? 'bg-red-500' :
                                            'bg-amber-500'
                                        }`} />
                                </div>

                                <div className="bg-card-text/5 rounded-sm p-6 border border-card-text/10 shadow-sm relative transition-all hover:bg-card-text/[0.07]">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-sm shadow-sm ${entry.status === 'APPROVED' ? 'bg-green-500 text-white' :
                                                entry.status === 'REJECTED' ? 'bg-red-500 text-white' :
                                                    'bg-amber-600 text-white'
                                                }`}>
                                                {entry.status}
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest leading-none mb-1">Date & Time</span>
                                                <span className="text-[11px] font-black opacity-60">
                                                    {new Date(entry.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end">
                                            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest leading-none mb-1 text-left sm:text-right">Action By</span>
                                            <span className="text-[11px] font-black opacity-80 uppercase tracking-tighter">
                                                {entry.adminName} <span className="opacity-40 ml-1">({entry.adminRole})</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-card-text/5">
                                        <MarkdownRenderer
                                            content={entry.message}
                                            className="text-sm prose prose-sm max-w-none prose-headings:font-black prose-p:font-bold prose-headings:text-card-text prose-p:text-card-text/80 leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 border-2 border-dashed border-card-text/5 rounded-sm flex flex-col items-center justify-center text-center">
                        <Info className="w-8 h-8 opacity-20 mb-3" />
                        <p className="text-xs font-black opacity-30 uppercase tracking-widest italic">No history details available</p>
                    </div>
                ),
                icon: Clock,
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
        <div className="flex flex-col h-full w-full">
            <div className="bg-card/80 backdrop-blur-2xl rounded-sm shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="p-1 flex items-center justify-between gap-4">
                    <div className="flex overflow-x-auto mb-4 xl:mb-0 pb-2 gap-3 scrollbar-none sm:flex-wrap">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => updateQueryParams({ status: tab.id, page: 1 })}
                                className={`px-5 py-2.5 rounded-sm font-bold text-sm cursor-pointer transition-all flex items-center gap-2 shadow-sm border whitespace-nowrap ${activeStatusTab === tab.id
                                    ? 'bg-card border-border text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
                                    : 'bg-card/5 border-transparent text-muted-foreground hover:bg-card/10 hover:text-foreground'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeStatusTab === tab.id ? tab.color : 'opacity-40'}`} />
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter transition-all ${activeStatusTab === tab.id ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto px-2">
                        <CustomSelect
                            value={orgTypeFilter}
                            onChange={(val) => updateQueryParams({ type: val, page: 1 })}
                            options={[
                                { value: 'ALL', label: 'All Org Types' },
                                { value: 'KINDERGARTEN', label: 'Kindergarten', icon: Pencil },
                                { value: 'PRE_SCHOOL', label: 'Pre-School', icon: Pencil },
                                { value: 'PRIMARY_SCHOOL', label: 'Primary School', icon: BookOpen },
                                { value: 'MIDDLE_SCHOOL', label: 'Middle School', icon: BookOpen },
                                { value: 'HIGH_SCHOOL', label: 'High School', icon: School },
                                { value: 'COLLEGE', label: 'College', icon: Library },
                                { value: 'UNIVERSITY', label: 'University', icon: GraduationCap },
                                { value: 'VOCATIONAL_SCHOOL', label: 'Vocational School', icon: Building2 },
                                { value: 'INSTITUTE', label: 'Institute', icon: Building2 },
                                { value: 'ACADEMY', label: 'Academy', icon: Building2 },
                                { value: 'TUTORING_CENTER', label: 'Tutoring Center', icon: BookOpen },
                                { value: 'ONLINE_SCHOOL', label: 'Online School', icon: MonitorPlay },
                                { value: 'OTHER', label: 'Other', icon: Info },
                            ]}
                            className="w-full sm:w-50 px-3"
                            placeholder="Org Type"
                        />

                        <SearchBar
                            value={searchQuery}
                            onChange={(val) => updateQueryParams({ search: val, page: 1 })}
                            placeholder="Search organizations..."
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    <DataTable
                        columns={columns}
                        data={fetchedData?.data || []}
                        keyExtractor={(row) => row.id}
                        isLoading={isFetching}
                        onRowClick={handleViewOrg}
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
                isSubmitting={actionLoading}
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
                            signature: 'EduVerse @ Support Team'
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
            <NewMailModal
                isOpen={newMailOpen}
                onClose={() => {
                    setNewMailOpen(false);
                    setInitialTargetId(undefined);
                    setInitialSubject(undefined);
                }}
                initialTargetId={initialTargetId}
                initialSubject={initialSubject}
                onSuccess={() => {
                    dispatch({ type: 'TOAST_ADD', payload: { message: 'Mail sent successfully', type: 'success' } });
                }}
            />
        </div>
    );
}
