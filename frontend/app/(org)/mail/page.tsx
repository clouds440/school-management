'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, ArrowUpRight, CheckCircle2, XCircle, Tag, Calendar, Filter, Clock, MailPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { MailItem, MailStatus, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { MailStatusBadge, MailPriorityBadge, getMailRowClassName } from '@/components/mail/MailStatusBadge';
import { MailDetailsModal } from '@/components/mail/MailDetailsModal';
import { NewMailModal } from '@/components/mail/NewMailModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import notificationsStore from '@/lib/notificationsStore';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { BrandIcon } from '@/components/ui/Brand';

export default function OrgMailPage() {
    const { user, token, loading: authLoading } = useAuth();
    const { state, dispatch } = useGlobal();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<MailItem> | null>(null);
    const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
    const [newMailOpen, setNewMailOpen] = useState(false);

    // Global symbols
    const fetching = state.ui.isLoading;

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

    const fetchMails = useCallback(async () => {
        if (!token) return;
        try {
            dispatch({ type: 'UI_SET_LOADING', payload: true });
            const [data, stats] = await Promise.all([
                api.mail.getMails(token, {
                    page,
                    limit: pageSize,
                    search: searchQuery,
                    status: statusFilter || undefined
                }),
                api.mail.getUnreadCount(token)
            ]);
            setPaginatedData(data);
            // Sync with global state
            dispatch({ type: 'STATS_SET_MAIL', payload: stats });
        } catch {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to fetch mail', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_LOADING', payload: false });
        }
    }, [token, page, searchQuery, statusFilter, pageSize, dispatch]);

    const { subscribe } = useSocket({
        token: token,
        userId: user?.id || undefined,
        userRole: user?.role || undefined,
        orgId: user?.orgId || undefined
    });

    useEffect(() => {
        if (!authLoading && token) {
            fetchMails();
            api.notifications.clearCategory('MAIL', token).catch(console.error);
        }
    }, [authLoading, token, fetchMails]);

    useEffect(() => {
        const mid = searchParams.get('mailId');
        if (mid) {
            setSelectedMailId(mid);
        }
    }, [searchParams]);

    useEffect(() => {
        // Debounce mail list refreshes to avoid repeated full fetches
        const timerRef: { current: number | null } = { current: null };
        const scheduleFetch = () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => {
                fetchMails();
                timerRef.current = null;
            }, 1000);
        };

        const unsubs = [
            subscribe('unread:update', scheduleFetch),
            subscribe('mail:new', scheduleFetch),
            subscribe('mail:message', scheduleFetch),
            subscribe('mail:update', scheduleFetch)
        ];

        return () => {
            unsubs.forEach(u => u());
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [subscribe, fetchMails]);

    const handleMailClick = (mail: MailItem) => {
        setSelectedMailId(mail.id);
        try {
            const { items } = notificationsStore.getAll();
            const notif = items.find(n => n.metadata?.mailId === mail.id || (n.actionUrl && n.actionUrl.includes(mail.id)) || n.metadata?.entityId === mail.id);
            if (notif && token) {
                // fire-and-forget optimistic mark-as-read
                notificationsStore.markAsReadGuard(notif.id, token).catch(() => { });
            }
        } catch {
            // swallow to avoid UI interruption
        }
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

    const columns: Column<MailItem>[] = [
        {
            header: 'Subject',
            accessor: (row: MailItem) => (
                <div className="flex flex-col">
                    <span className="font-black text-foreground group-hover:text-primary transition-colors">{row.subject}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">#{row.id.slice(0, 8)}</span>
                </div>
            )
        },
        {
            header: 'Sender',
            accessor: (row: MailItem) => {
                return (
                    <div className="flex items-center gap-3">
                        <BrandIcon
                            variant="user"
                            size="sm"
                            user={row.creator}
                            className="w-8 h-8 rounded-full shadow-sm"
                        />
                        <div className="min-w-0">
                            <p className="text-xs font-black text-foreground truncate max-w-30">{row.creator?.name || row.creator?.email || 'Unknown'}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{row.creatorRole?.replace('_', ' ') || 'N/A'}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Category',
            accessor: (row: MailItem) => (
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100/50">
                    <Tag className="w-3 h-3" />
                    {row.category.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'Status',
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
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-[10px] font-black text-muted-foreground min-w-7.5 justify-center">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        {row._count?.messages || 0}
                    </div>
                    {row.unreadCount > 0 && (
                        <span className="bg-red-500 text-red-50 px-2 py-0.5 rounded-full text-[9px] font-black animate-in fade-in zoom-in duration-300">
                            {row.unreadCount} new
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Date',
            accessor: (row: MailItem) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 opacity-30" />
                    <span className="text-xs font-bold font-mono">{new Date(row.updatedAt).toLocaleString()}</span>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full w-full">
            <div className="bg-card/80 backdrop-blur-2xl p-1 md:p-2 rounded-lg border border-border shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2 shrink-0">
                    <div className="flex flex-1 items-center gap-4 w-full">
                        <div className="w-full md:w-64">
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Statuses', badge: state.stats.mail?.total },
                                    { value: MailStatus.OPEN, label: 'Open', badge: state.stats.mail?.countsByStatus?.[MailStatus.OPEN], icon: Clock, iconClassName: 'text-blue-500' },
                                    { value: MailStatus.IN_PROGRESS, label: 'In Progress', badge: state.stats.mail?.countsByStatus?.[MailStatus.IN_PROGRESS], icon: ArrowUpRight, iconClassName: 'text-amber-500' },
                                    { value: MailStatus.AWAITING_RESPONSE, label: 'Awaiting Response', badge: state.stats.mail?.countsByStatus?.[MailStatus.AWAITING_RESPONSE], icon: MessageSquare, iconClassName: 'text-indigo-500' },
                                    { value: MailStatus.RESOLVED, label: 'Resolved', badge: state.stats.mail?.countsByStatus?.[MailStatus.RESOLVED], icon: CheckCircle2, iconClassName: 'text-green-500' },
                                    { value: MailStatus.CLOSED, label: 'Closed', badge: state.stats.mail?.countsByStatus?.[MailStatus.CLOSED], icon: XCircle, iconClassName: 'text-muted-foreground' },
                                ]}
                                value={statusFilter}
                                onChange={(val: string) => updateFilters('status', val)}
                                placeholder="Filter Status"
                                icon={Filter}
                            />
                        </div>
                        <SearchBar
                            placeholder="Search mail by subject or content..."
                            value={searchQuery}
                            onChange={(val: string) => updateFilters('search', val)}
                            className="bg-card/60 border-border"
                        />
                    </div>
                    <div className='w-full sm:w-auto'>
                        <Button
                            onClick={() => setNewMailOpen(true)}
                            icon={MailPlus}
                            className="flex items-center w-full justify-center gap-2 px-8 bg-primary text-primary-text rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 shrink-0 border-none"
                        >
                            New Mail
                        </Button>
                    </div>
                </div>

                <div className="relative overflow-x-hidden flex-1 min-h-0">
                    <DataTable
                        columns={columns}
                        data={paginatedData?.data || []}
                        keyExtractor={(row: MailItem) => row.id}
                        isLoading={fetching}
                        onRowClick={handleMailClick}
                        currentPage={paginatedData?.currentPage || 1}
                        totalPages={paginatedData?.totalPages || 1}
                        totalResults={paginatedData?.totalRecords || 0}
                        pageSize={pageSize}
                        onPageChange={(p: number) => updateFilters('page', p.toString())}
                        onPageSizeChange={handlePageSizeChange}
                        getRowClassName={(row: MailItem) => getMailRowClassName(row.status)}
                        maxHeight="100%"
                    />
                </div>
            </div>

            <MailDetailsModal
                isOpen={!!selectedMailId}
                mailId={selectedMailId}
                onClose={() => {
                    setSelectedMailId(null);
                    // Clear the mailId from the URL
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('mailId');
                    const query = params.toString();
                    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
                }}
                onUpdate={fetchMails}
            />

            <NewMailModal
                isOpen={newMailOpen}
                onClose={() => setNewMailOpen(false)}
                onSuccess={() => {
                    fetchMails();
                    dispatch({ type: 'TOAST_ADD', payload: { message: 'Mail sent', type: 'success' } });
                }}
            />
        </div>
    );
}
