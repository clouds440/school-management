'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowUpRight, Calendar, Hash, Inbox, Mail, MessageSquare, Plus, Tag, User } from 'lucide-react';
import { api } from '@/lib/api';
import { RequestItem, RequestDetail, RequestStatus, PaginatedResponse, UpdateRequestPayload, ApiError } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { RequestStatusBadge, RequestPriorityBadge } from '@/components/requests/RequestStatusBadge';
import { RequestThread } from '@/components/requests/RequestThread';
import { NewRequestModal } from '@/components/requests/NewRequestModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getPublicUrl } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useSocket } from '@/hooks/useSocket';
import { useGlobal } from '@/context/GlobalContext';
import Image from 'next/image';

const getStatusColor = (status: RequestStatus) => {
    switch (status) {
        case RequestStatus.OPEN: return { border: 'border-l-blue-500', bg: 'bg-blue-50' };
        case RequestStatus.IN_PROGRESS: return { border: 'border-l-amber-400', bg: 'bg-amber-50' };
        case RequestStatus.AWAITING_RESPONSE: return { border: 'border-l-indigo-400', bg: 'bg-indigo-50' };
        case RequestStatus.RESOLVED: return { border: 'border-l-emerald-500', bg: 'bg-emerald-50' };
        case RequestStatus.CLOSED: return { border: 'border-l-slate-400', bg: 'bg-slate-50' };
        default: return { border: 'border-l-gray-200', bg: 'bg-white' };
    }
};

export default function OrgMailPage() {
    const { user, token, loading } = useAuth();
    const { showToast } = useToast();
    const { state } = useGlobal();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<RequestItem> | null>(null);
    const [fetching, setFetching] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
    const [threadModalOpen, setThreadModalOpen] = useState(false);
    const [newRequestOpen, setNewRequestOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<RequestStatus | null>(null);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchQuery = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const statusFilter = searchParams.get('status') || 'ALL';

    const updateQueryParams = (updates: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '') {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const fetchRequests = useCallback(async () => {
        if (!token) return;
        try {
            const response = await api.requests.getRequests(token, {
                page,
                limit: 10,
                search: searchQuery,
                sortBy,
                sortOrder,
            });
            setPaginatedData(response);
            // Layout handles the unread count globally
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch requests';
            showToast(message, 'error');
        } finally {
            setFetching(false);
        }
    }, [token, page, searchQuery, sortBy, sortOrder, showToast]);

    const { subscribe, joinRoom, leaveRoom } = useSocket({
        token: token,
        userId: user?.id || undefined,
        userRole: user?.role || undefined,
        orgId: user?.orgId || undefined
    });

    useEffect(() => {
        if (!loading && user && token) {
            fetchRequests();
        }
    }, [loading, user, token, fetchRequests]);

    // Real-time: Refresh list on new/unread updates
    useEffect(() => {
        const unsubs = [
            subscribe('unread:update', () => fetchRequests()),
            subscribe('request:new', () => fetchRequests())
        ];
        return () => unsubs.forEach(u => u());
    }, [subscribe, fetchRequests]);

    // Real-time: Refresh selected thread
    useEffect(() => {
        if (!selectedRequest?.id) return;

        joinRoom(`request:${selectedRequest.id}`);

        const unsubs = [
            subscribe('request:message', async (data: unknown) => {
                const payload = data as { requestId: string };
                if (payload.requestId === selectedRequest.id) {
                    const updated = await api.requests.getRequest(selectedRequest.id, token!);
                    setSelectedRequest(updated);
                    fetchRequests();
                }
            }),
            subscribe('request:update', (data: unknown) => {
                const updated = data as RequestDetail;
                if (updated.id === selectedRequest.id) {
                    setSelectedRequest(updated);
                    fetchRequests();
                }
            })
        ];

        return () => {
            unsubs.forEach(u => u());
            leaveRoom(`request:${selectedRequest.id}`);
        };
    }, [selectedRequest?.id, subscribe, joinRoom, leaveRoom, token, fetchRequests]);

    const handleViewRequest = async (item: RequestItem) => {
        if (!token) return;
        try {
            const detail = await api.requests.getRequest(item.id, token);
            setSelectedRequest(detail);
            setThreadModalOpen(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to load request';
            showToast(message, 'error');
        }
    };

    const handleReply = async (content: string, files?: File[]) => {
        if (!token || !selectedRequest) return;
        try {
            const response = await api.requests.addMessage(selectedRequest.id, { content }, token);

            // Upload files if any
            if (files && files.length > 0) {
                const orgId = user?.orgId || 'SYSTEM';
                await Promise.all(
                    files.map(file =>
                        api.files.uploadFile(orgId, 'REQUEST_MESSAGE', response.id, file, token)
                    )
                );
                // Refresh detail
                const updated = await api.requests.getRequest(selectedRequest.id, token);
                setSelectedRequest(updated);
            } else {
                const updated = await api.requests.getRequest(selectedRequest.id, token);
                setSelectedRequest(updated);
            }

            showToast('Reply sent', 'success');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to send reply';
            showToast(message, 'error');
        }
    };

    const handleStatusUpdate = async (newStatus: RequestStatus) => {
        if (!token || !selectedRequest || updatingStatus) return;

        if (newStatus === RequestStatus.RESOLVED || newStatus === RequestStatus.CLOSED) {
            setPendingStatus(newStatus);
            setConfirmOpen(true);
            return;
        }

        await executeStatusUpdate(newStatus);
    };

    const executeStatusUpdate = async (newStatus: RequestStatus) => {
        if (!token || !selectedRequest) return;
        try {
            setUpdatingStatus(true);
            const payload: UpdateRequestPayload = { status: newStatus };
            const updated = await api.requests.updateRequest(selectedRequest.id, payload, token);
            setSelectedRequest(updated);
            showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
            fetchRequests(); // refresh list
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const message = apiError?.message || 'Failed to update status';
            showToast(message, 'error');
        } finally {
            setUpdatingStatus(false);
            setConfirmOpen(false);
            setPendingStatus(null);
        }
    };

    const requests = paginatedData?.data || [];
    const isClosed = selectedRequest?.status === RequestStatus.RESOLVED || selectedRequest?.status === RequestStatus.CLOSED;

    const columns: Column<RequestItem>[] = [
        {
            header: 'Mail',
            sortable: true,
            sortKey: 'subject',
            accessor: (row) => (
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary/10 rounded-sm flex items-center justify-center text-primary shrink-0">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-card-text leading-tight truncate">{row.subject}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-bold text-card-text/40 bg-card-text/5 px-1.5 py-0.5 rounded-sm">{row.category.replace('_', ' ')}</span>
                            <span className="text-[10px] items-center gap-1 text-card-text/40 font-bold hidden sm:flex">
                                <Hash className="w-2.5 h-2.5" />
                                {row.id.slice(0, 8)}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Sender',
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-card-text/5 border border-white/10 flex items-center justify-center text-card-text/40 text-[10px] font-black uppercase overflow-hidden relative">
                        {row.creator?.avatarUrl ? (
                            <Image src={getPublicUrl(row.creator.avatarUrl)} alt={row.creator?.name || ''} fill className="object-cover" unoptimized />
                        ) : (
                            (row.creator?.name || row.creator?.email || '?')[0]
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-black text-card-text truncate max-w-[120px]">{row.creator?.name || row.creator.email}</p>
                        <p className="text-[10px] font-bold text-card-text/40 uppercase">{row.creatorRole?.replace('_', ' ')}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Recipient',
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    {row.assignees && row.assignees.length > 0 ? (
                        <>
                            <div className="flex -space-x-2 mr-1">
                                {row.assignees.slice(0, 2).map((a) => (
                                    <div key={a.id} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-primary text-[9px] font-black uppercase shadow-sm overflow-hidden relative">
                                        {a.avatarUrl ? (
                                            <Image src={getPublicUrl(a.avatarUrl)} alt={a.name || ''} fill className="object-cover" unoptimized />
                                        ) : (
                                            (a.name || a.email || '?')[0]
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-card-text truncate max-w-[120px]">
                                    {row.assignees.length > 1
                                        ? `${row.assignees[0].name || row.assignees[0].email} +${row.assignees.length - 1}`
                                        : (row.assignees[0].name || row.assignees[0].email)}
                                </p>
                                <p className="text-[10px] font-bold text-primary/60 uppercase">
                                    {row.assignees.length > 1 ? 'Multiple' : 'Personal'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 text-[10px] font-black uppercase text-center leading-none shadow-sm">
                                <span className="scale-75">GRP</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-card-text truncate max-w-[120px]">
                                    {row.targetRole ? row.targetRole.replace('_', ' ') : 'Platform Support'}
                                </p>
                                <p className="text-[10px] font-bold text-orange-400 uppercase">Team</p>
                            </div>
                        </>
                    )}
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (row) => <RequestStatusBadge status={row.status} />
        },
        {
            header: 'Priority',
            accessor: (row) => <RequestPriorityBadge priority={row.priority} />
        },
        {
            header: 'Messages',
            accessor: (row) => (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-card-text/5 rounded-full text-[10px] font-black text-card-text/40 min-w-[30px] justify-center">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {row._count?.messages || 0}
                    </div>
                    {row.unreadCount > 0 && (
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black animate-in fade-in zoom-in duration-300">
                            {row.unreadCount} new
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Date',
            sortable: true,
            sortKey: 'createdAt',
            accessor: (row) => (
                <div className="flex items-center text-xs font-medium text-card-text/60 gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.createdAt).toLocaleDateString()}
                </div>
            )
        },
    ];

    const sortConfig = { key: sortBy, direction: sortOrder };

    return (
        <div className="flex flex-col h-full w-full animate-fade-in-up">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Inbox className="w-8 h-8 text-primary" />
                        MAIL PORTAL
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Communication & Requests Hub</p>
                </div>
                <button
                    onClick={() => setNewRequestOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-sm font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-95 shadow-xl shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    New Message
                </button>
            </div>

            {/* My Requests Table */}
            <div className="bg-card/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/20 flex flex-col w-full overflow-hidden flex-1 min-h-0">
                <div className="px-8 pt-4 border-b border-white/10 flex flex-col gap-6 bg-slate-50/50 shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
                            <CustomSelect
                                value={statusFilter}
                                onChange={(val) => updateQueryParams({ status: val, page: 1 })}
                                options={[
                                    { value: 'ALL', label: 'All Statuses', badge: state.stats.mail?.total },
                                    { value: RequestStatus.OPEN, label: 'Open', badge: (state.stats.mail as any)?.countsByStatus?.[RequestStatus.OPEN] },
                                    { value: RequestStatus.IN_PROGRESS, label: 'In Progress', badge: (state.stats.mail as any)?.countsByStatus?.[RequestStatus.IN_PROGRESS] },
                                    { value: RequestStatus.AWAITING_RESPONSE, label: 'Awaiting Response', badge: (state.stats.mail as any)?.countsByStatus?.[RequestStatus.AWAITING_RESPONSE] },
                                    { value: RequestStatus.RESOLVED, label: 'Resolved', badge: (state.stats.mail as any)?.countsByStatus?.[RequestStatus.RESOLVED] },
                                    { value: RequestStatus.CLOSED, label: 'Closed', badge: (state.stats.mail as any)?.countsByStatus?.[RequestStatus.CLOSED] },
                                ]}
                                className="w-full sm:w-[240px]"
                                placeholder="Status"
                            />

                            <SearchBar
                                value={searchQuery}
                                onChange={(val) => updateQueryParams({ search: val, page: 1 })}
                                placeholder="Search mail..."
                            />
                        </div>
                    </div>
                    <div className="flex gap-8 overflow-x-auto scrollbar-none pb-0.5">
                        <button
                            onClick={() => updateQueryParams({ status: 'ALL', page: 1 })}
                            className={`flex items-center gap-2 pb-3 px-1 text-[11px] font-black uppercase tracking-widest transition-all relative ${statusFilter === 'ALL' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Mail className="w-3.5 h-3.5" />
                            All Mails
                            {statusFilter === 'ALL' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                        </button>
                    </div>
                </div>

                <div className="p-4 flex-1 min-h-0 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={requests}
                        keyExtractor={(row) => row.id}
                        isLoading={fetching}
                        onRowClick={handleViewRequest}
                        currentPage={paginatedData?.currentPage || 1}
                        totalPages={paginatedData?.totalPages || 1}
                        totalResults={paginatedData?.totalRecords || 0}
                        pageSize={10}
                        onPageChange={(p) => updateQueryParams({ page: p })}
                        sortConfig={sortConfig}
                        onSort={(key, direction) => updateQueryParams({ sortBy: key, sortOrder: direction })}
                        getRowClassName={(row) => {
                            const statusColor = getStatusColor(row.status);
                            return `border-l-4 ${statusColor.border} ${statusColor.bg}/40 transition-colors`;
                        }}
                        maxHeight="100%"
                    />
                </div>
            </div>

            {/* Contact Info Cards */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 mt-3 gap-6">
                <div className="bg-card/80 backdrop-blur-xl p-8 rounded-sm border border-white/20 shadow-xl flex flex-col items-center text-center space-y-4 hover:shadow-2xl transition-all group">
                    <div className="w-16 h-16 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-text transition-all">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-card-text">Mail Requests</h3>
                    <p className="text-card-text/60 font-medium h-12">Submit a request via mail for detailed inquiries</p>
                    <a href="mailto:support@edumanage.com" className="text-primary font-bold hover:underline flex items-center gap-1">
                        support@edumanage.com
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                <div className="bg-card/80 backdrop-blur-xl p-8 rounded-sm border border-white/20 shadow-xl flex flex-col items-center text-center space-y-4 hover:shadow-2xl transition-all group">
                    <div className="w-16 h-16 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-text transition-all">
                        <Phone className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-card-text">Direct Line</h3>
                    <p className="text-card-text/60 font-medium h-12">Talk to a support representative immediately</p>
                    <p className="text-primary font-bold">+1 (800) EDU-HELP</p>
                </div>

                <div className="bg-card/80 backdrop-blur-xl p-8 rounded-sm border border-white/20 shadow-xl flex flex-col items-center text-center space-y-4 hover:shadow-2xl transition-all group">
                    <div className="w-16 h-16 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-text transition-all">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-card-text">Visit Us</h3>
                    <p className="text-card-text/60 font-medium h-12">Headquarters for in-person consultations</p>
                    <p className="text-primary font-bold">New York, NY 10001</p>
                </div>
            </div> */}

            {/* Thread Modal */}
            <Modal
                isOpen={threadModalOpen}
                onClose={() => { setThreadModalOpen(false); setSelectedRequest(null); }}
                title={selectedRequest?.subject}
                subtitle={
                    selectedRequest ? (
                        <span className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1 text-primary/60"><Tag className="w-3 h-3" />{selectedRequest.category.replace('_', ' ')}</span>
                            <span className="flex items-center gap-1 text-card-text/40"><Hash className="w-3 h-3" />{selectedRequest.id.slice(0, 8)}</span>
                            <span className="flex items-center gap-1 text-card-text/40"><User className="w-3 h-3" />{selectedRequest.creator?.name || selectedRequest.creator?.email}</span>
                        </span>
                    ) : undefined
                }
                maxWidth="max-w-4xl"
            >
                {selectedRequest && (
                    <div className="flex flex-col" style={{ minHeight: '400px' }}>
                        {/* Status controls */}
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10 flex-wrap">
                            <RequestStatusBadge status={selectedRequest.status} />
                            <RequestPriorityBadge priority={selectedRequest.priority} />

                            {!isClosed && (
                                <div className="flex items-center gap-2 ml-auto">
                                    {selectedRequest.status === RequestStatus.OPEN && (
                                        <button
                                            onClick={() => handleStatusUpdate(RequestStatus.IN_PROGRESS)}
                                            disabled={updatingStatus}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50"
                                        >
                                            <ArrowUpRight className="w-3 h-3" />
                                            Start Progress
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleStatusUpdate(RequestStatus.RESOLVED)}
                                        disabled={updatingStatus}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50"
                                    >
                                        Resolve
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(RequestStatus.CLOSED)}
                                        disabled={updatingStatus}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-gray-600 transition-all disabled:opacity-50"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>

                        <RequestThread
                            request={selectedRequest}
                            currentUserId={user?.id || ''}
                            onReply={handleReply}
                            isClosed={isClosed}
                        />
                    </div>
                )}
            </Modal>

            {/* Confirmation Dialog for status updates */}
            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setPendingStatus(null); }}
                onConfirm={() => pendingStatus && executeStatusUpdate(pendingStatus)}
                title={`Mark as ${pendingStatus?.replace('_', ' ')}?`}
                description={`Are you sure you want to change the status to ${pendingStatus?.replace('_', ' ')}? This action will be logged and notify participants.`}
                confirmText={`Yes, ${pendingStatus?.replace('_', ' ')}`}
                isDestructive={pendingStatus === RequestStatus.CLOSED}
            />

            <NewRequestModal
                isOpen={newRequestOpen}
                onClose={() => setNewRequestOpen(false)}
                onSuccess={() => {
                    fetchRequests();
                    showToast('Mail sent successfully!', 'success');
                }}
            />
        </div>
    );
}
