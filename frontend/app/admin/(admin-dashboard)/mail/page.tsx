'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { Filter, MessageSquare, ArrowUpRight, CheckCircle2, XCircle, Hash, Calendar, Clock, MailPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { MailItem, MailStatus, Role, PaginatedResponse, ApiError } from '@/types';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { MailStatusBadge, MailPriorityBadge, getMailRowClassName } from '@/components/mail/MailStatusBadge';
import { MailDetailsModal } from '@/components/mail/MailDetailsModal';
import { NewMailModal } from '@/components/mail/NewMailModal';
import { useSocket } from '@/hooks/useSocket';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { BrandIcon } from '@/components/ui/Brand';

export default function MailPage() {
    const { user, token, loading: authLoading } = useAuth();
    const { state, dispatch } = useGlobal();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<MailItem> | null>(null);
    const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
    const [newMailOpen, setNewMailOpen] = useState(false);

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

    const fetchMails = useCallback(async () => {
        if (!token) return;
        try {
            dispatch({ type: 'UI_SET_LOADING', payload: true });
            const [data, stats] = await Promise.all([
                api.mail.getMails(token, {
                    page,
                    limit: pageSize,
                    search: searchQuery,
                    sortBy,
                    sortOrder,
                    status: statusFilter !== 'ALL' ? statusFilter : undefined,
                }),
                api.mail.getUnreadCount(token)
            ]);
            setPaginatedData(data);
            // Sync with global state
            dispatch({ type: 'STATS_SET_MAIL', payload: stats });
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const rawMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to fetch mail';
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
            fetchMails();
        }
    }, [authLoading, user, token, fetchMails]);

    useEffect(() => {
        const mid = searchParams.get('mailId');
        if (mid) {
            setSelectedMailId(mid);
        }
    }, [searchParams]);

    useEffect(() => {
        const unsubs = [
            subscribe('unread:update', () => fetchMails()),
            subscribe('mail:new', () => fetchMails()),
            subscribe('mail:message', () => fetchMails()),
            subscribe('mail:update', () => fetchMails())
        ];
        return () => unsubs.forEach(u => u());
    }, [subscribe, fetchMails]);

    const handleViewMail = (item: MailItem) => {
        setSelectedMailId(item.id);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        localStorage.setItem('edu-admin-mail-limit', String(newSize));
        updateQueryParams({ page: 1 });
    };

    const mails = paginatedData?.data || [];

    const columns: Column<MailItem>[] = [
        {
            header: 'Mail',
            sortable: true,
            sortKey: 'subject',
            accessor: (row: MailItem) => (
                <div className="flex items-start gap-3 min-0">
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
            accessor: (row: MailItem) => {
                return (
                    <div className="flex items-center gap-3">
                        {row.organization ? (
                            <div className="relative">
                                <BrandIcon
                                    variant="brand"
                                    size="sm"
                                    user={{ ...row.creator, orgLogoUrl: row.organization.logoUrl, orgName: row.organization.name }}
                                    className="w-8 h-8 border border-indigo-100"
                                />
                                <div className="absolute bottom-0 -right-1 w-4 h-4 rounded-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                                    <BrandIcon
                                        variant="user"
                                        size="sm"
                                        user={row.creator}
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>
                        ) : (
                            <BrandIcon
                                variant="user"
                                size="sm"
                                user={row.creator}
                                className="w-8 h-8"
                            />
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
            accessor: (row: MailItem) => (
                <div className="flex items-center gap-2">
                    {row.assignees && row.assignees.length > 0 ? (
                        <>
                            <div className="flex -space-x-2 mr-1">
                                {row.assignees.slice(0, 2).map((a) => (
                                    <div key={a.id} className="w-7 h-7 border-2 border-white rounded-full bg-indigo-100 shadow-sm">
                                        <BrandIcon variant="user" size="sm" user={a} className="w-full h-full" />
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
            accessor: (row: MailItem) => <MailStatusBadge status={row.status} />
        },
        {
            header: 'Priority',
            accessor: (row: MailItem) => <MailPriorityBadge priority={row.priority} />
        },
        {
            header: 'Messages',
            accessor: (row: MailItem) => (
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
            accessor: (req: MailItem) => (
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
            <div className="bg-card/80 backdrop-blur-2xl rounded-sm shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="p-1">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
                            <CustomSelect
                                value={statusFilter}
                                onChange={(val: string) => updateQueryParams({ status: val, page: 1 })}
                                options={[
                                    { value: 'ALL', label: 'All Statuses', badge: state.stats.mail?.total },
                                    { value: MailStatus.OPEN, label: 'Open', badge: state.stats.mail?.countsByStatus?.[MailStatus.OPEN], icon: Clock, iconClassName: 'text-blue-500' },
                                    { value: MailStatus.IN_PROGRESS, label: 'In Progress', badge: state.stats.mail?.countsByStatus?.[MailStatus.IN_PROGRESS], icon: ArrowUpRight, iconClassName: 'text-amber-500' },
                                    { value: MailStatus.AWAITING_RESPONSE, label: 'Awaiting Response', badge: state.stats.mail?.countsByStatus?.[MailStatus.AWAITING_RESPONSE], icon: MessageSquare, iconClassName: 'text-indigo-500' },
                                    { value: MailStatus.RESOLVED, label: 'Resolved', badge: state.stats.mail?.countsByStatus?.[MailStatus.RESOLVED], icon: CheckCircle2, iconClassName: 'text-green-500' },
                                    { value: MailStatus.CLOSED, label: 'Closed', badge: state.stats.mail?.countsByStatus?.[MailStatus.CLOSED], icon: XCircle, iconClassName: 'text-gray-500' },
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
                            onClick={() => setNewMailOpen(true)}
                            icon={MailPlus}
                            className="flex items-center gap-2 px-8 bg-indigo-600 text-white rounded-sm font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 shrink-0 border-none"
                        >
                            NEW MAIL
                        </Button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={mails}
                        keyExtractor={(row) => row.id}
                        isLoading={fetching}
                        onRowClick={handleViewMail}
                        currentPage={paginatedData?.currentPage || 1}
                        totalPages={paginatedData?.totalPages || 1}
                        totalResults={paginatedData?.totalRecords || 0}
                        pageSize={pageSize}
                        onPageChange={(p: number) => updateQueryParams({ page: p })}
                        onPageSizeChange={handlePageSizeChange}
                        sortConfig={{ key: sortBy, direction: sortOrder }}
                        onSort={(key, direction) => updateQueryParams({ sortBy: key, sortOrder: direction })}
                        getRowClassName={(row: MailItem) => getMailRowClassName(row.status)}
                        maxHeight="100%"
                    />
                </div>
            </div>

            <MailDetailsModal
                isOpen={!!selectedMailId}
                mailId={selectedMailId}
                onClose={() => setSelectedMailId(null)}
                onUpdate={fetchMails}
            />

            <NewMailModal
                isOpen={newMailOpen}
                onClose={() => setNewMailOpen(false)}
                onSuccess={() => { fetchMails(); dispatch({ type: 'TOAST_ADD', payload: { message: 'Mail sent', type: 'success' } }); }}
            />
        </div>
    );
}
