'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Calendar, Plus, ArrowUpRight, Hash, User, Building2, Tag } from 'lucide-react';
import { api } from '@/lib/api';
import { RequestItem, RequestDetail, RequestStatus, Role, PaginatedResponse, UpdateRequestPayload, ApiError } from '@/types';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Modal } from '@/components/ui/Modal';
import { RequestStatusBadge, RequestPriorityBadge } from '@/components/requests/RequestStatusBadge';
import { RequestThread } from '@/components/requests/RequestThread';
import { NewRequestModal } from '@/components/requests/NewRequestModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSocket } from '@/hooks/useSocket';
import { getPublicUrl } from '@/lib/utils';

export default function RequestsPage() {
    const { user, token, loading } = useAuth();
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

    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchQuery = searchParams.get('search') || '';
    const statusFilter = (searchParams.get('status') || 'ALL');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
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
            const response = await api.requests.getRequests(token, {
                page,
                limit: 10,
                search: searchQuery,
                sortBy,
                sortOrder,
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
            });
            setPaginatedData(response);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const rawMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to fetch requests';
            const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
            showToast(message, 'error');
        } finally {
            setFetching(false);
        }
    }, [token, page, searchQuery, sortBy, sortOrder, statusFilter, showToast]);

    const { subscribe, joinRoom, leaveRoom } = useSocket({
        token: token,
        userId: user?.id || undefined,
        userRole: user?.role || undefined,
        orgId: user?.organizationId || undefined
    });

    useEffect(() => {
        if (!loading && user && (user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) && token) {
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
            subscribe('request:message', async (data: any) => {
                if (data.requestId === selectedRequest.id) {
                    const updated = await api.requests.getRequest(selectedRequest.id, token!);
                    setSelectedRequest(updated);
                    fetchRequests(); // Also refresh list to update message count/last update
                }
            }),
            subscribe('request:update', (updated: any) => {
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
            const apiError = error as ApiError;
            const rawMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to load request';
            const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
            showToast(message, 'error');
        }
    };

    const handleReply = async (content: string, files?: File[]) => {
        if (!token || !selectedRequest) return;
        try {
            const response = await api.requests.addMessage(selectedRequest.id, { content }, token);
            
            // Upload files if any
            if (files && files.length > 0) {
                const orgId = selectedRequest.organizationId || 'SYSTEM';
                await Promise.all(
                    files.map(file => 
                        api.files.uploadFile(orgId, 'REQUEST_MESSAGE', response.id, file, token)
                    )
                );
                // Refresh detail after file uploads
                const updated = await api.requests.getRequest(selectedRequest.id, token);
                setSelectedRequest(updated);
            } else {
                // If no files, we can just use the returned message to update local state if we want,
                // but getRequest is safer to get the full updated thread
                const updated = await api.requests.getRequest(selectedRequest.id, token);
                setSelectedRequest(updated);
            }
            
            showToast('Reply sent', 'success');
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const rawMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to send reply';
            const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
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
            const rawMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to update status';
            const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
            showToast(message, 'error');
        } finally {
            setUpdatingStatus(false);
            setConfirmOpen(false);
            setPendingStatus(null);
        }
    };

    // handleCreateRequest is now handled internally by NewRequestModal

    const requests = paginatedData?.data || [];

    const columns: Column<RequestItem>[] = [
        {
            header: 'Mail',
            sortable: true,
            sortKey: 'subject',
            accessor: (row) => (
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
            accessor: (row) => {
                const orgLogo = row.organization?.logoUrl ? getPublicUrl(row.organization.logoUrl) : null;
                const userAvatar = row.creator?.avatarUrl ? getPublicUrl(row.creator.avatarUrl) : null;

                return (
                    <div className="flex items-center gap-3">
                        {row.organization ? (
                            <div className="relative">
                                <div className="w-8 h-8 rounded-sm bg-indigo-50 border border-indigo-100 overflow-hidden shrink-0 flex items-center justify-center">
                                    {orgLogo ? (
                                        <img src={orgLogo} alt={row.organization.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="w-4 h-4 text-indigo-400" />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                                    {userAvatar ? (
                                        <img src={userAvatar} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[8px] font-black text-gray-400 uppercase">{(row.creator?.name || '?')[0]}</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {userAvatar ? (
                                    <img src={userAvatar} alt={row.creator?.name || ''} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4 text-gray-400" />
                                )}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs font-black text-gray-700 truncate max-w-[120px]">{row.creator?.name || row.creator.email}</p>
                            <div className="flex items-center gap-1.5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">{row.creatorRole?.replace('_', ' ')}</p>
                                {row.organization && (
                                    <span className="text-[10px] font-black text-indigo-500 truncate max-w-[80px]">
                                        • {row.organization.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Recipient',
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    {row.assignees && row.assignees.length > 0 ? (
                        <>
                            <div className="flex -space-x-2 mr-1">
                                {row.assignees.slice(0, 2).map((a, i) => (
                                    <div key={a.id} className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-600 text-[9px] font-black uppercase shadow-sm overflow-hidden">
                                        {a.avatarUrl ? (
                                            <img src={getPublicUrl(a.avatarUrl)} className="w-full h-full object-cover" />
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
            accessor: (row) => <RequestStatusBadge status={row.status} />
        },
        {
            header: 'Priority',
            accessor: (row) => <RequestPriorityBadge priority={row.priority} />
        },
        {
            header: 'Messages',
            accessor: (row) => (
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                    <MessageSquare className="w-3 h-3" />
                    {row._count?.messages || 0}
                </div>
            )
        },
        {
            header: 'Date',
            sortable: true,
            sortKey: 'createdAt',
            accessor: (row) => (
                <div className="flex items-center text-xs font-medium text-gray-500 gap-1.5 opacity-80">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.createdAt).toLocaleDateString()}
                </div>
            )
        },
    ];

    if (loading || (!user && !loading)) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const isClosed = selectedRequest?.status === RequestStatus.RESOLVED || selectedRequest?.status === RequestStatus.CLOSED;

    return (
        <div className="flex flex-col w-full animate-fade-in-up">
            <div className="bg-white/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/50 flex flex-col w-full overflow-hidden">
                <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex flex-col gap-6 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
                            <CustomSelect
                                value={statusFilter}
                                onChange={(val) => updateQueryParams({ status: val, page: 1 })}
                                options={[
                                    { value: 'ALL', label: 'All Statuses' },
                                    { value: RequestStatus.OPEN, label: 'Open' },
                                    { value: RequestStatus.IN_PROGRESS, label: 'In Progress' },
                                    { value: RequestStatus.AWAITING_RESPONSE, label: 'Awaiting Response' },
                                    { value: RequestStatus.RESOLVED, label: 'Resolved' },
                                    { value: RequestStatus.CLOSED, label: 'Closed' },
                                ]}
                                className="w-full sm:w-[200px]"
                                placeholder="Status"
                            />

                            <SearchBar
                                value={searchQuery}
                                onChange={(val) => updateQueryParams({ search: val, page: 1 })}
                                placeholder="Search mail..."
                            />
                        </div>
                        <button
                            onClick={() => setNewRequestOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-sm font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            SEND MAIL
                        </button>
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-gray-50/10">
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
                        sortConfig={{ key: sortBy, direction: sortOrder }}
                        onSort={(key, direction) => updateQueryParams({ sortBy: key, sortOrder: direction })}
                        getRowClassName={(row) => {
                            if (row.status === RequestStatus.OPEN) return '!bg-blue-50/40 border-l-4 border-l-blue-500 shadow-sm';
                            if (row.status === RequestStatus.IN_PROGRESS) return '!bg-amber-50/40 border-l-4 border-l-amber-400';
                            return '';
                        }}
                    />
                </div>
            </div>

            {/* Thread Modal */}
            <Modal
                isOpen={threadModalOpen}
                onClose={() => { setThreadModalOpen(false); setSelectedRequest(null); }}
                title={selectedRequest?.subject}
                subtitle={
                    selectedRequest ? (
                        <span className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{selectedRequest.category.replace('_', ' ')}</span>
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{selectedRequest.id.slice(0, 8)}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{selectedRequest.creator?.name || selectedRequest.creator?.email}</span>
                            {selectedRequest.organization && (
                                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{selectedRequest.organization.name}</span>
                            )}
                        </span>
                    ) : undefined
                }
                maxWidth="max-w-4xl"
            >
                {selectedRequest && (
                    <div className="flex flex-col" style={{ minHeight: '400px' }}>
                        {/* Status controls */}
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 flex-wrap">
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

                        {/* Thread */}
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

            {/* New Request Modal */}
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
