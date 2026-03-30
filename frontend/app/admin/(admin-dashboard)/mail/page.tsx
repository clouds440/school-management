'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { Search, Plus, Filter, MessageSquare, ArrowUpRight, CheckCircle2, XCircle, Tag, Hash, User as UserIcon, Building2, Calendar, User, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { RequestItem, RequestDetail, RequestStatus, Role, PaginatedResponse, UpdateRequestPayload, ApiError } from '@/types';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Modal } from '@/components/ui/Modal';
import { RequestStatusBadge, RequestPriorityBadge } from '@/components/requests/RequestStatusBadge';
import { RequestThread, RequestThreadHandle } from '@/components/requests/RequestThread';
import { NewRequestModal } from '@/components/requests/NewRequestModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSocket } from '@/hooks/useSocket';
import { getPublicUrl } from '@/lib/utils';
import { Loading } from '@/components/ui/Loading';
import Image from 'next/image';

export default function RequestsPage() {
    const { user, token, loading } = useAuth();
    const { state, dispatch } = useGlobal();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<RequestItem> | null>(null);
    const [fetching, setFetching] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
    const [threadModalOpen, setThreadModalOpen] = useState(false);
    const [newRequestOpen, setNewRequestOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<RequestStatus | null>(null);
    const threadRef = useRef<RequestThreadHandle>(null);

    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchQuery = searchParams.get('search') || '';
    const statusFilter = (searchParams.get('status') || 'ALL');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    const updateQueryParams = (updates: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '' || value === 'ALL') {
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
            setFetching(true);
            const [data, stats] = await Promise.all([
                api.requests.getRequests(token, {
                    page,
                    limit: 10,
                    search: searchQuery,
                    sortBy,
                    sortOrder,
                    status: statusFilter !== 'ALL' ? statusFilter : undefined,
                }),
                api.requests.getUnreadCount(token)
            ]);
            setPaginatedData(data);
            // Sync with global state
            dispatch({ type: 'STATS_SET_MAIL', payload: stats });
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const rawMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to fetch requests';
            const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
            showToast(message, 'error');
        } finally {
            setFetching(false);
        }
    }, [token, page, searchQuery, sortBy, sortOrder, statusFilter, showToast, dispatch]);

    const { subscribe, joinRoom, leaveRoom } = useSocket({
        token: token,
        userId: user?.id || undefined,
        userRole: user?.role || undefined,
        orgId: user?.orgId || undefined
    });

    useEffect(() => {
        if (!loading && user && (user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) && token) {
            fetchRequests();
        }
    }, [loading, user, token, fetchRequests]);

    // Real-time updates
    useEffect(() => {
        const unsubs = [
            subscribe('unread:update', () => fetchRequests()),
            subscribe('request:new', () => fetchRequests())
        ];
        return () => unsubs.forEach(u => u());
    }, [subscribe, fetchRequests]);

    useEffect(() => {
        if (!selectedRequest?.id) return;
        joinRoom(`request:${selectedRequest.id}`);
        const unsubs = [
            subscribe('request:message', async (data: unknown) => {
                const payload = data as { requestId: string };
                if (payload.requestId === selectedRequest.id && token) {
                    const updated = await api.requests.getRequest(selectedRequest.id, token);
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
            showToast('Failed to load request', 'error');
        }
    };

    const handleReply = async (content: string, files?: File[]) => {
        if (!selectedRequest || !token) return;
        try {
            await api.requests.addMessage(selectedRequest.id, { content }, token, files);
            const updated = await api.requests.getRequest(selectedRequest.id, token);
            setSelectedRequest(updated);
        } catch (error) {
            showToast('Failed to send reply', 'error');
        }
    };

    const handleScrollToReply = () => {
        threadRef.current?.scrollToReply();
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
            fetchRequests();
        } catch (error: unknown) {
            showToast('Failed to update status', 'error');
        } finally {
            setUpdatingStatus(false);
            setConfirmOpen(false);
            setPendingStatus(null);
        }
    };

    const requests = paginatedData?.data || [];

    const columns: Column<RequestItem>[] = [
        {
            header: 'Mail',
            sortable: true,
            sortKey: 'subject',
            accessor: (row: RequestItem) => (
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 rounded-sm flex items-center justify-center text-indigo-600 shrink-0">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-gray-900 leading-tight truncate">{row.subject}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-sm">{row.category.replace('_', ' ')}</span>
                            <span className="text-[10px] items-center gap-1 text-gray-400 font-bold hidden sm:flex">
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
            accessor: (row: RequestItem) => {
                const orgLogo = row.organization?.logoUrl ? getPublicUrl(row.organization.logoUrl) : null;
                const userAvatar = row.creator?.avatarUrl ? getPublicUrl(row.creator.avatarUrl) : null;
                return (
                    <div className="flex items-center gap-3">
                        {row.organization ? (
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 overflow-hidden shrink-0 flex items-center justify-center relative">
                                    {orgLogo ? (
                                        <Image src={orgLogo} alt={row.organization.name} fill className="object-cover rounded-sm" unoptimized />
                                    ) : (
                                        <Building2 className="w-4 h-4 text-indigo-400" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 -right-1 w-4 h-4 rounded-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                                    {userAvatar ? (
                                        <Image src={userAvatar} alt={row.creator?.name || ''} fill className="object-cover rounded-full" unoptimized />
                                    ) : (
                                        <span className="text-[8px] font-black text-gray-400 uppercase">{(row.creator?.name || '?')[0]}</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center relative">
                                {userAvatar ? (
                                    <Image src={userAvatar} alt={row.creator?.name || ''} fill className="object-cover rounded-full" unoptimized />
                                ) : (
                                    <User className="w-4 h-4 text-gray-400" />
                                )}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs font-black text-gray-700 truncate max-w-[120px]">{row.creator?.name || row.creator.email}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{row.creatorRole?.replace('_', ' ')}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Recipient',
            accessor: (row: RequestItem) => (
                <div className="flex items-center gap-2">
                    {row.assignees && row.assignees.length > 0 ? (
                        <>
                            <div className="flex -space-x-2 mr-1">
                                {row.assignees.slice(0, 2).map((a) => (
                                    <div key={a.id} className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-600 text-[9px] font-black uppercase shadow-sm overflow-hidden relative">
                                        {a.avatarUrl ? (
                                            <Image src={getPublicUrl(a.avatarUrl)} alt={a.name || ''} fill className="object-cover rounded-full" unoptimized />
                                        ) : (
                                            (a.name || a.email || '?')[0]
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-700 truncate max-w-[120px]">
                                    {row.assignees.length > 1
                                        ? `${row.assignees[0].name || row.assignees[0].email} +${row.assignees.length - 1}`
                                        : (row.assignees[0].name || row.assignees[0].email)}
                                </p>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase">
                                    {row.assignees.length > 1 ? 'Multiple' : 'Personal'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-black uppercase text-center leading-none shadow-sm">
                                <span className="scale-75">GRP</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-700 truncate max-w-[120px]">
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
            sortable: true,
            sortKey: 'status',
            accessor: (row: RequestItem) => <RequestStatusBadge status={row.status} />
        },
        {
            header: 'Priority',
            accessor: (row: RequestItem) => <RequestPriorityBadge priority={row.priority} />
        },
        {
            header: 'Messages',
            accessor: (row: RequestItem) => (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 min-w-[30px] justify-center">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
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
            accessor: (req: RequestItem) => (
                <div className="flex items-center text-xs font-medium text-card-text/60 gap-1.5">
                    <Calendar className="w-3 h-3" /> {new Date(req.createdAt).toLocaleString()}
                </div>
            )
        },
    ];

    if (loading || (!user && !loading)) {
        return <Loading fullScreen text="Preparing Mailbox..." size="lg" />;
    }

    const isClosed = selectedRequest?.status === RequestStatus.CLOSED || selectedRequest?.status === RequestStatus.RESOLVED;

    return (
        <div className="flex flex-col h-full w-full animate-fade-in-up">
            <div className="bg-white/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/50 flex flex-col w-full overflow-hidden flex-1 min-h-0">
                <div className="px-8 pt-4 border-b border-gray-100 flex flex-col gap-6 bg-gray-50/50 shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
                            <CustomSelect
                                value={statusFilter}
                                onChange={(val: string) => updateQueryParams({ status: val, page: 1 })}
                                options={[
                                    { value: 'ALL', label: 'All Statuses', badge: state.stats.mail?.total },
                                    { value: RequestStatus.OPEN, label: 'Open', badge: state.stats.mail?.countsByStatus?.[RequestStatus.OPEN], icon: Clock, iconClassName: 'text-blue-500' },
                                    { value: RequestStatus.IN_PROGRESS, label: 'In Progress', badge: state.stats.mail?.countsByStatus?.[RequestStatus.IN_PROGRESS], icon: ArrowUpRight, iconClassName: 'text-amber-500' },
                                    { value: RequestStatus.AWAITING_RESPONSE, label: 'Awaiting Response', badge: state.stats.mail?.countsByStatus?.[RequestStatus.AWAITING_RESPONSE], icon: MessageSquare, iconClassName: 'text-indigo-500' },
                                    { value: RequestStatus.RESOLVED, label: 'Resolved', badge: state.stats.mail?.countsByStatus?.[RequestStatus.RESOLVED], icon: CheckCircle2, iconClassName: 'text-green-500' },
                                    { value: RequestStatus.CLOSED, label: 'Closed', badge: state.stats.mail?.countsByStatus?.[RequestStatus.CLOSED], icon: XCircle, iconClassName: 'text-gray-500' },
                                ]}
                                className="w-full sm:w-[240px]"
                                placeholder="Status"
                                icon={Filter}
                            />
                            <SearchBar
                                value={searchQuery}
                                onChange={(val: string) => updateQueryParams({ search: val, page: 1 })}
                                placeholder="Search mail..."
                            />
                        </div>
                        <button
                            onClick={() => setNewRequestOpen(true)}
                            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-sm font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            NEW MAIL
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-gray-50/10 flex-1 min-h-0 overflow-hidden">
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
                        onPageChange={(p: number) => updateQueryParams({ page: p })}
                        sortConfig={{ key: sortBy, direction: sortOrder }}
                        onSort={(key, direction) => updateQueryParams({ sortBy: key, sortOrder: direction })}
                        getRowClassName={(row) => {
                            if (row.status === RequestStatus.OPEN) return '!bg-blue-50/40 border-l-4 border-l-blue-500 shadow-sm transition-colors';
                            if (row.status === RequestStatus.IN_PROGRESS) return '!bg-amber-50/40 border-l-4 border-l-amber-400 transition-colors';
                            if (row.status === RequestStatus.AWAITING_RESPONSE) return '!bg-indigo-50/40 border-l-4 border-l-indigo-400 transition-colors';
                            if (row.status === RequestStatus.RESOLVED) return '!bg-emerald-50/40 border-l-4 border-l-emerald-500 transition-colors';
                            if (row.status === RequestStatus.CLOSED) return '!bg-slate-50/40 border-l-4 border-l-slate-400 opacity-80 transition-colors';
                            return 'transition-colors';
                        }}
                        maxHeight="100%"
                    />
                </div>
            </div>

            <Modal
                isOpen={threadModalOpen}
                onClose={() => { setThreadModalOpen(false); setSelectedRequest(null); }}
                title={
                    selectedRequest ? (
                        <div className="flex items-center justify-between w-full pr-12">
                            <span className="text-xl font-black text-gray-900">{selectedRequest.subject}</span>
                            {!isClosed && (
                                <div className="flex items-center gap-2 ml-4">
                                    {selectedRequest.status === RequestStatus.OPEN && (
                                        <button
                                            onClick={() => handleStatusUpdate(RequestStatus.IN_PROGRESS)}
                                            disabled={updatingStatus}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 shadow-sm"
                                        >
                                            <ArrowUpRight className="w-3 h-3" />
                                            In Progress
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleStatusUpdate(RequestStatus.RESOLVED)}
                                        disabled={updatingStatus}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50 shadow-sm"
                                    >
                                        <CheckCircle2 className="w-3 h-3" />
                                        Resolve
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(RequestStatus.CLOSED)}
                                        disabled={updatingStatus}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 text-white rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-gray-600 transition-all disabled:opacity-50 shadow-sm"
                                    >
                                        <XCircle className="w-3 h-3" />
                                        Close Thread
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : undefined
                }
                subtitle={
                    selectedRequest ? (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{selectedRequest.category.replace('_', ' ')}</span>
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{selectedRequest.id.slice(0, 8)}</span>
                            <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{selectedRequest.creator?.name || selectedRequest.creator?.email}</span>
                            {selectedRequest.organization && (
                                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{selectedRequest.organization.name}</span>
                            )}
                        </div>
                    ) : undefined
                }
                maxWidth="max-w-5xl"
                footer={
                    selectedRequest ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                {!isClosed ? (
                                    <button
                                        onClick={handleScrollToReply}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-200/50"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Reply to Thread
                                    </button>
                                ) : (
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Thread is {selectedRequest.status}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { setThreadModalOpen(false); setSelectedRequest(null); }}
                                className="px-6 py-2.5 text-gray-600 bg-gray-200 hover:bg-gray-300 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Close Window
                            </button>
                        </div>
                    ) : undefined
                }
            >
                {selectedRequest && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex items-center gap-3 mb-6 shrink-0 flex-wrap">
                            <RequestStatusBadge status={selectedRequest.status} />
                            <RequestPriorityBadge priority={selectedRequest.priority} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <RequestThread
                                ref={threadRef}
                                request={selectedRequest}
                                currentUserId={user?.id || ''}
                                currentUserRole={user?.role}
                                onReply={handleReply}
                                isClosed={isClosed}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setPendingStatus(null); }}
                onConfirm={() => pendingStatus && executeStatusUpdate(pendingStatus)}
                title="Status Update"
                description={`Are you sure you want to ${pendingStatus?.replace('_', ' ')} this mail thread?`}
            />

            <NewRequestModal
                isOpen={newRequestOpen}
                onClose={() => setNewRequestOpen(false)}
                onSuccess={() => { fetchRequests(); showToast('Mail sent', 'success'); }}
            />
        </div>
    );
}
