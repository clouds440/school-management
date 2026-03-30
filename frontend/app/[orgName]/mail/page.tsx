'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, MessageSquare, ArrowUpRight, CheckCircle2, XCircle, Tag, Hash, Calendar, User, Building2, Search, Filter, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { RequestItem, RequestDetail, RequestStatus, PaginatedResponse, UpdateRequestPayload, ApiError } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { RequestStatusBadge, RequestPriorityBadge } from '@/components/requests/RequestStatusBadge';
import { RequestThread, RequestThreadHandle } from '@/components/requests/RequestThread';
import { NewRequestModal } from '@/components/requests/NewRequestModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { useToast } from '@/context/ToastContext';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getPublicUrl } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import Image from 'next/image';

export default function OrgRequestsPage() {
    const { user, token, loading } = useAuth();
    const { state, dispatch } = useGlobal();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<RequestItem> | null>(null);
    const [fetching, setFetching] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
    const [newRequestOpen, setNewRequestOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const threadRef = useRef<RequestThreadHandle>(null);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchQuery = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';

    const fetchRequests = useCallback(async () => {
        if (!token) return;
        setFetching(true);
        try {
            const [data, stats] = await Promise.all([
                api.requests.getRequests(token, {
                    page,
                    limit: 10,
                    search: searchQuery,
                    status: statusFilter || undefined
                }),
                api.requests.getUnreadCount(token)
            ]);
            setPaginatedData(data);
            // Sync with global state
            dispatch({ type: 'STATS_SET_MAIL', payload: stats });
        } catch (error) {
            showToast('Failed to fetch requests', 'error');
        } finally {
            setFetching(false);
        }
    }, [token, page, searchQuery, statusFilter, showToast, dispatch]);

    const { subscribe, joinRoom, leaveRoom } = useSocket({
        token: token,
        userId: user?.id || undefined,
        userRole: user?.role || undefined,
        orgId: user?.orgId || undefined
    });

    useEffect(() => {
        if (!loading && token) {
            fetchRequests();
        }
    }, [loading, token, fetchRequests]);

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

    const handleRequestClick = async (request: RequestItem) => {
        if (!token) return;
        try {
            const detail = await api.requests.getRequest(request.id, token);
            setSelectedRequest(detail);
        } catch (error) {
            showToast('Failed to load thread', 'error');
        }
    };

    const handleStatusUpdate = async (newStatus: RequestStatus) => {
        if (!selectedRequest || !token) return;
        setUpdatingStatus(true);
        try {
            await api.requests.updateRequest(selectedRequest.id, { status: newStatus }, token);
            const updated = await api.requests.getRequest(selectedRequest.id, token);
            setSelectedRequest(updated);
            fetchRequests();
            showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
        } catch (error) {
            showToast('Failed to update status', 'error');
        } finally {
            setUpdatingStatus(false);
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

    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const isClosed = selectedRequest?.status === RequestStatus.CLOSED || selectedRequest?.status === RequestStatus.RESOLVED;

    const columns: Column<RequestItem>[] = [
        {
            header: 'Subject',
            accessor: (row: RequestItem) => (
                <div className="flex flex-col">
                    <span className="font-black text-gray-900 group-hover:text-primary transition-colors">{row.subject}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">#{row.id.slice(0, 8)}</span>
                </div>
            )
        },
        {
            header: 'Sender',
            accessor: (row: RequestItem) => {
                const userAvatar = row.creator?.avatarUrl ? getPublicUrl(row.creator.avatarUrl) : null;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center relative">
                            {userAvatar ? (
                                <Image src={userAvatar} alt={row.creator?.name || ''} fill className="object-cover rounded-full" unoptimized />
                            ) : (
                                <User className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-black text-gray-700 truncate max-w-[120px]">{row.creator?.name || row.creator.email}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{row.creatorRole?.replace('_', ' ')}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Category',
            accessor: (row: RequestItem) => (
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-sm border border-indigo-100/50">
                    <Tag className="w-3 h-3" />
                    {row.category.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'Status',
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
            accessor: (row: RequestItem) => (
                <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4 opacity-30" />
                    <span className="text-xs font-bold">{new Date(row.updatedAt).toLocaleString()}</span>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-xl p-6 rounded-sm border border-white/20 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-4 w-full">
                        <div className="w-full md:w-64">
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Statuses', badge: state.stats.mail?.total },
                                    { value: RequestStatus.OPEN, label: 'Open', badge: state.stats.mail?.countsByStatus?.[RequestStatus.OPEN], icon: Clock, iconClassName: 'text-blue-500' },
                                    { value: RequestStatus.IN_PROGRESS, label: 'In Progress', badge: state.stats.mail?.countsByStatus?.[RequestStatus.IN_PROGRESS], icon: ArrowUpRight, iconClassName: 'text-amber-500' },
                                    { value: RequestStatus.RESOLVED, label: 'Resolved', badge: state.stats.mail?.countsByStatus?.[RequestStatus.RESOLVED], icon: CheckCircle2, iconClassName: 'text-green-500' },
                                    { value: RequestStatus.CLOSED, label: 'Closed', badge: state.stats.mail?.countsByStatus?.[RequestStatus.CLOSED], icon: XCircle, iconClassName: 'text-gray-500' },
                                ]}
                                value={statusFilter}
                                onChange={(val: string) => updateFilters('status', val)}
                                placeholder="Filter Status"
                                icon={Filter}
                            />
                        </div>
                        <SearchBar
                            placeholder="Search requests by subject or content..."
                            value={searchQuery}
                            onChange={(val: string) => updateFilters('search', val)}
                            className="bg-white/50 border-white/20"
                        />
                    </div>
                    <button
                        onClick={() => setNewRequestOpen(true)}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-text rounded-sm text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        New Request
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    data={paginatedData?.data || []}
                    keyExtractor={(row: RequestItem) => row.id}
                    isLoading={fetching}
                    onRowClick={handleRequestClick}
                    currentPage={paginatedData?.currentPage || 1}
                    totalPages={paginatedData?.totalPages || 1}
                    totalResults={paginatedData?.totalRecords || 0}
                    pageSize={10}
                    onPageChange={(p: number) => updateFilters('page', p.toString())}
                />
            </div>

            <Modal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title={
                    selectedRequest ? (
                        <div className="flex items-center w-full pr-12 text-sm sm:text-base md:text-xl">
                            <span className="text-xl font-black text-gray-900">{selectedRequest.subject}</span>
                        </div>
                    ) : undefined
                }
                subtitle={
                    selectedRequest ? (
                        <div className="block md:flex items-center justify-between w-full pr-12 text-sm sm:text-base md:text-xl">
                            <div className="flex items-center gap-3 flex-wrap text-[10px] text-indigo-500/60 font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{selectedRequest.category.replace('_', ' ')}</span>
                                <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{selectedRequest.id.slice(0, 8)}</span>
                                <span className="flex items-center gap-1"><User className="w-3 h-3" />Support Team</span>
                            </div>
                            <div className="block md:flex md:ml-5">
                                {!isClosed && (
                                    <div className="flex items-center mt-3 md:mt-0 gap-2 md:ml-4">
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
                                onClick={() => setSelectedRequest(null)}
                                className="px-6 py-2.5 text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest transition-all"
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

            <NewRequestModal
                isOpen={newRequestOpen}
                onClose={() => setNewRequestOpen(false)}
                onSuccess={() => {
                    fetchRequests();
                    showToast('Mail sent', 'success');
                }}
            />
        </div>
    );
}
