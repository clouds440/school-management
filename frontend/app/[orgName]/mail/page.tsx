'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Calendar, Plus, ArrowUpRight, Hash, User, Building2, Tag, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { RequestItem, RequestDetail, RequestStatus, PaginatedResponse, Role, UpdateRequestPayload, ApiError } from '@/types';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { RequestStatusBadge, RequestPriorityBadge } from '@/components/requests/RequestStatusBadge';
import { RequestThread } from '@/components/requests/RequestThread';
import { NewRequestModal } from '@/components/requests/NewRequestModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getPublicUrl } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useSocket } from '@/hooks/useSocket';

export default function OrgMailPage() {
    const { user, token, loading } = useAuth();
    const { showToast } = useToast();
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
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

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
            setFetching(true);
            const response = await api.requests.getRequests(token, {
                page,
                limit: 10,
                search: searchQuery,
                sortBy,
                sortOrder,
            });
            setPaginatedData(response);
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
        orgId: user?.organizationId || undefined
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
            subscribe('request:message', async (data: any) => {
                if (data.requestId === selectedRequest.id) {
                    const updated = await api.requests.getRequest(selectedRequest.id, token!);
                    setSelectedRequest(updated);
                    fetchRequests(); 
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
                const orgId = user?.organizationId || 'SYSTEM';
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
                    <div className="w-7 h-7 rounded-full bg-card-text/5 border border-white/10 flex items-center justify-center text-card-text/40 text-[10px] font-black uppercase overflow-hidden">
                        {row.creator?.avatarUrl ? (
                            <img src={getPublicUrl(row.creator.avatarUrl)} className="w-full h-full object-cover" />
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
                                {row.assignees.slice(0, 2).map((a, i) => (
                                    <div key={a.id} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-primary text-[9px] font-black uppercase shadow-sm overflow-hidden">
                                        {a.avatarUrl ? (
                                            <img src={getPublicUrl(a.avatarUrl)} className="w-full h-full object-cover" />
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
                <div className="flex items-center gap-1 text-xs font-bold text-card-text/60">
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
                <div className="flex items-center text-xs font-medium text-card-text/60 gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.createdAt).toLocaleDateString()}
                </div>
            )
        },
    ];

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3 drop-shadow-xl">
                        <Mail className="w-10 h-10" />
                        Mail &amp; Communication
                    </h1>
                    <p className="text-white/80 font-bold opacity-80 mt-2 uppercase tracking-widest text-[10px]">
                        VIEW YOUR REQUESTS AND SUBMIT NEW ONES
                    </p>
                </div>
            </div>

            {/* My Requests Table */}
            <div className="bg-card/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/20 flex flex-col w-full overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <SearchBar
                        value={searchQuery}
                        onChange={(val) => updateQueryParams({ search: val, page: 1 })}
                        placeholder="Search mail..."
                    />
                    <button
                        onClick={() => setNewRequestOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-text rounded-sm font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        SEND MAIL
                    </button>
                </div>

                <div className="p-4">
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
                            if (row.status === RequestStatus.OPEN) return '!bg-blue-500/5 border-l-4 border-l-blue-400';
                            return '';
                        }}
                    />
                </div>
            </div>

            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>

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

            {/* New Request Modal */}
            <NewRequestModal
                isOpen={newRequestOpen}
                onClose={() => setNewRequestOpen(false)}
                onSuccess={() => {
                    fetchRequests();
                    showToast('Mail sent successfully!', 'success');
                }}
            />
        </>
    );
}
