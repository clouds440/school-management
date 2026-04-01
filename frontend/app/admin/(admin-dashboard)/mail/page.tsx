'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { Search, Plus, Filter, MessageSquare, ArrowUpRight, CheckCircle2, XCircle, Hash, Building2, Calendar, User, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { RequestItem, RequestStatus, Role, PaginatedResponse, ApiError } from '@/types';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { RequestStatusBadge, RequestPriorityBadge, getRequestRowClassName } from '@/components/requests/RequestStatusBadge';
import { RequestDetailsModal } from '@/components/requests/RequestDetailsModal';
import { NewRequestModal } from '@/components/requests/NewRequestModal';
import { useSocket } from '@/hooks/useSocket';
import { getPublicUrl } from '@/lib/utils';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export default function RequestsPage() {
    const { user, token, loading: authLoading } = useAuth();
    const { state, dispatch } = useGlobal();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<RequestItem> | null>(null);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [newRequestOpen, setNewRequestOpen] = useState(false);

    // Global UI states alias
    const fetching = state.ui.isLoading;
    const isProcessing = state.ui.isProcessing;

    const [pageSize, setPageSize] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('edu-admin-mail-limit');
            return saved ? parseInt(saved, 10) : 10;
        }
        return 10;
    });

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
            dispatch({ type: 'UI_SET_LOADING', payload: true });
            const [data, stats] = await Promise.all([
                api.requests.getRequests(token, {
                    page,
                    limit: pageSize,
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
            dispatch({ type: 'TOAST_ADD', payload: { message, type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_LOADING', payload: false });
        }
    }, [token, page, searchQuery, sortBy, sortOrder, statusFilter, pageSize, dispatch]);

    const { subscribe, joinRoom, leaveRoom } = useSocket({
        token: token,
        userId: user?.id || undefined,
        userRole: user?.role || undefined,
        orgId: user?.orgId || undefined
    });

    useEffect(() => {
        if (!authLoading && user && (user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) && token) {
            fetchRequests();
        }
    }, [authLoading, user, token, fetchRequests]);

    useEffect(() => {
        const rid = searchParams.get('requestId');
        if (rid) {
            setSelectedRequestId(rid);
        }
    }, [searchParams]);

    useEffect(() => {
        const unsubs = [
            subscribe('unread:update', () => fetchRequests()),
            subscribe('request:new', () => fetchRequests()),
            subscribe('request:message', () => fetchRequests()),
            subscribe('request:update', () => fetchRequests())
        ];
        return () => unsubs.forEach(u => u());
    }, [subscribe, fetchRequests]);

    const handleViewRequest = (item: RequestItem) => {
        setSelectedRequestId(item.id);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        localStorage.setItem('edu-admin-mail-limit', String(newSize));
        updateQueryParams({ page: 1 });
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
                            <p className="text-xs font-black text-gray-700 truncate max-w-[120px]">{row.creator?.name || row.creator?.email || 'Unknown'}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{row.creatorRole?.replace('_', ' ') || 'N/A'}</p>
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

    if (authLoading || (!user && !authLoading)) {
        return <Loading fullScreen text="Preparing Mailbox..." size="lg" />;
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className="bg-card/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/20 p-1 md:p-2 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="px-6 md:px-8 pt-2 pb-2 border-b border-gray-100 flex flex-col gap-4 bg-gray-50/50 shrink-0">
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
                        <Button
                            onClick={() => setNewRequestOpen(true)}
                            icon={Plus}
                            className="flex items-center gap-2 px-8 bg-indigo-600 text-white rounded-sm font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 shrink-0 border-none"
                        >
                            NEW MAIL
                        </Button>
                    </div>
                </div>

                <div className="p-1 md:p-2 bg-gray-50/10 flex-1 min-h-0 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={requests}
                        keyExtractor={(row) => row.id}
                        isLoading={fetching}
                        onRowClick={handleViewRequest}
                        currentPage={paginatedData?.currentPage || 1}
                        totalPages={paginatedData?.totalPages || 1}
                        totalResults={paginatedData?.totalRecords || 0}
                        pageSize={pageSize}
                        onPageChange={(p: number) => updateQueryParams({ page: p })}
                        onPageSizeChange={handlePageSizeChange}
                        sortConfig={{ key: sortBy, direction: sortOrder }}
                        onSort={(key, direction) => updateQueryParams({ sortBy: key, sortOrder: direction })}
                        getRowClassName={(row: RequestItem) => getRequestRowClassName(row.status)}
                        maxHeight="100%"
                    />
                </div>
            </div>

            <RequestDetailsModal
                isOpen={!!selectedRequestId}
                requestId={selectedRequestId}
                onClose={() => setSelectedRequestId(null)}
                onUpdate={fetchRequests}
            />

            <NewRequestModal
                isOpen={newRequestOpen}
                onClose={() => setNewRequestOpen(false)}
                onSuccess={() => { fetchRequests(); dispatch({ type: 'TOAST_ADD', payload: { message: 'Mail sent', type: 'success' } }); }}
            />
        </div>
    );
}
