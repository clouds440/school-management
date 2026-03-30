'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, MessageSquare, ArrowUpRight, CheckCircle2, XCircle, Tag, Hash, Calendar, User, Filter, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { RequestItem, RequestDetail, RequestStatus, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { RequestStatusBadge, RequestPriorityBadge } from '@/components/requests/RequestStatusBadge';
import { RequestThread, RequestThreadHandle } from '@/components/requests/RequestThread';
import { NewRequestModal } from '@/components/requests/NewRequestModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getPublicUrl } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export default function OrgRequestsPage() {
    const { user, token, loading: authLoading } = useAuth();
    const { state, dispatch } = useGlobal();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<RequestItem> | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
    const [newRequestOpen, setNewRequestOpen] = useState(false);
    const threadRef = useRef<RequestThreadHandle>(null);

    // Global symbols
    const fetching = state.ui.isLoading;
    const isProcessing = state.ui.isProcessing;

    const [pageSize, setPageSize] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('edu-org-mail-limit');
            return saved ? parseInt(saved, 10) : 10;
        }
        return 10;
    });

    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchQuery = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';

    const fetchRequests = useCallback(async () => {
        if (!token) return;
        try {
            dispatch({ type: 'UI_SET_LOADING', payload: true });
            const [data, stats] = await Promise.all([
                api.requests.getRequests(token, {
                    page,
                    limit: pageSize,
                    search: searchQuery,
                    status: statusFilter || undefined
                }),
                api.requests.getUnreadCount(token)
            ]);
            setPaginatedData(data);
            // Sync with global state
            dispatch({ type: 'STATS_SET_MAIL', payload: stats });
        } catch (error: unknown) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to fetch requests', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_LOADING', payload: false });
        }
    }, [token, page, searchQuery, statusFilter, pageSize, dispatch]);

    const { subscribe, joinRoom, leaveRoom } = useSocket({
        token: token,
        userId: user?.id || undefined,
        userRole: user?.role || undefined,
        orgId: user?.orgId || undefined
    });

    useEffect(() => {
        if (!authLoading && token) {
            fetchRequests();
        }
    }, [authLoading, token, fetchRequests]);

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
            dispatch({ type: 'UI_SET_PROCESSING', payload: true });
            const detail = await api.requests.getRequest(request.id, token);
            setSelectedRequest(detail);
        } catch (error: unknown) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load thread', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleStatusUpdate = async (newStatus: RequestStatus) => {
        if (!selectedRequest || !token || isProcessing) return;
        try {
            dispatch({ type: 'UI_SET_PROCESSING', payload: true });
            await api.requests.updateRequest(selectedRequest.id, { status: newStatus }, token);
            const updated = await api.requests.getRequest(selectedRequest.id, token);
            setSelectedRequest(updated);
            fetchRequests();
            dispatch({ type: 'TOAST_ADD', payload: { message: `Status updated to ${newStatus.replace('_', ' ')}`, type: 'success' } });
        } catch (error: unknown) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to update status', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleReply = async (content: string, files?: File[]) => {
        if (!selectedRequest || !token) return;
        try {
            dispatch({ type: 'UI_SET_PROCESSING', payload: true });
            await api.requests.addMessage(selectedRequest.id, { content }, token, files);
            const updated = await api.requests.getRequest(selectedRequest.id, token);
            setSelectedRequest(updated);
            fetchRequests();
        } catch (error: unknown) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to send reply', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
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
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        localStorage.setItem('edu-org-mail-limit', String(newSize));
        updateFilters('page', '1');
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
                            <p className="text-xs font-black text-gray-700 truncate max-w-[120px]">{row.creator?.name || row.creator?.email || 'Unknown'}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{row.creatorRole?.replace('_', ' ') || 'N/A'}</p>
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
                    <span className="text-xs font-bold font-mono">{new Date(row.updatedAt).toLocaleString()}</span>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full w-full">
            <div className="bg-card/80 backdrop-blur-2xl p-1 md:p-2 rounded-sm border border-white/20 shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2 shrink-0">
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
                    <Button
                        onClick={() => setNewRequestOpen(true)}
                        icon={Plus}
                        className="flex items-center justify-center gap-2 px-8 bg-primary text-primary-text rounded-sm text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 shrink-0 border-none"
                    >
                        New Request
                    </Button>
                </div>

                <div className="relative overflow-x-hidden flex-1 min-h-0">
                    <DataTable
                        columns={columns}
                        data={paginatedData?.data || []}
                        keyExtractor={(row: RequestItem) => row.id}
                        isLoading={fetching}
                        onRowClick={handleRequestClick}
                        currentPage={paginatedData?.currentPage || 1}
                        totalPages={paginatedData?.totalPages || 1}
                        totalResults={paginatedData?.totalRecords || 0}
                        pageSize={pageSize}
                        onPageChange={(p: number) => updateFilters('page', p.toString())}
                        onPageSizeChange={handlePageSizeChange}
                        maxHeight="100%"
                    />
                </div>
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
                                            <Button
                                                onClick={() => handleStatusUpdate(RequestStatus.IN_PROGRESS)}
                                                variant="secondary"
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all border-none shadow-sm"
                                            >
                                                <ArrowUpRight className="w-3 h-3" />
                                                In Progress
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => handleStatusUpdate(RequestStatus.RESOLVED)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-all border-none shadow-sm"
                                        >
                                            <CheckCircle2 className="w-3 h-3" />
                                            Resolve
                                        </Button>
                                        <Button
                                            onClick={() => handleStatusUpdate(RequestStatus.CLOSED)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 text-white rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-gray-600 transition-all border-none shadow-sm"
                                        >
                                            <XCircle className="w-3 h-3" />
                                            Close Thread
                                        </Button>
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
                                    <Button
                                        onClick={handleScrollToReply}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-200/50"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Reply to Thread
                                    </Button>
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
                    dispatch({ type: 'TOAST_ADD', payload: { message: 'Mail sent', type: 'success' } });
                }}
            />
        </div>
    );
}
