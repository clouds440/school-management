'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Calendar, Hash, Building2, Tag, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { SupportTicket, SupportTopic, OrgStatus, Role, PaginatedResponse } from '@/types';
import { TableActions, AdminAction } from '@/components/ui/TableActions';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';
import { DataField, useUI } from '@/context/UIContext';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function SupportPage() {
    const { user, token, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<SupportTicket> | null>(null);
    const { openViewModal } = useUI();
    const [fetching, setFetching] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // URL State
    const page = parseInt(searchParams.get('page') || '1', 10);
    const searchQuery = searchParams.get('search') || '';
    const topicFilter = (searchParams.get('topic') as SupportTopic | 'ALL') || 'ALL';
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

    const fetchTickets = useCallback(async () => {
        if (!token) return;
        try {
            setFetching(true);
            const response = await api.admin.getSupportTickets(token, {
                page,
                limit: 10,
                search: searchQuery,
                sortBy,
                sortOrder,
            });
            setPaginatedData(response);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch data';
            showToast(message, 'error');
        } finally {
            setFetching(false);
        }
    }, [token, page, searchQuery, sortBy, sortOrder, showToast]);

    useEffect(() => {
        if (!loading && user && (user.role === Role.SUPER_ADMIN || user.role === Role.PLATFORM_ADMIN) && token) {
            fetchTickets();
        }
    }, [loading, user, token, fetchTickets]);

    const handleResolveTicket = async (id: string) => {
        if (!token) return;
        try {
            setActionLoading(`resolve-${id}`);
            await api.admin.resolveSupportTicket(id, token);
            showToast('Ticket marked as resolved', 'success');
            fetchTickets();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to resolve ticket';
            showToast(message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // Note: Approve, Reject, Suspend for orgs inside support logic was a bit convoluted in the old file,
    // I'll keep the core actions but mostly focus on support items here to simplify.
    const handleApprove = async (id: string, name: string) => {
        if (!token) return;
        try {
            setActionLoading(`approve-${id}`);
            await api.admin.approveOrganization(id, token);
            showToast(`${name} approved successfully`, 'success');
            fetchTickets();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to approve organization';
            showToast(message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const tickets = paginatedData?.data || [];

    // Topic filtering if not done on server
    const filteredTickets = tickets.filter(ticket => {
        const matchesTopic = topicFilter === 'ALL' || ticket.topic === topicFilter;
        return matchesTopic;
    });

    const columns: Column<SupportTicket>[] = [
        {
            header: 'Organization',
            sortable: true,
            sortKey: 'organizationName', // backend needs to handle this
            accessor: (row) => (
                <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 rounded-sm flex items-center justify-center text-indigo-600 shrink-0">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-gray-900 leading-tight flex items-center gap-2">
                            {row.organization?.name}
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${row.organization?.status === OrgStatus.REJECTED ? 'bg-red-100 text-red-600' :
                                row.organization?.status === OrgStatus.SUSPENDED ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                }`}>
                                {row.organization?.status}
                            </span>
                        </h4>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mt-0.5">{row.topic.replace('_', ' ')}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Message',
            accessor: (row) => (
                <div className="max-w-[400px]">
                    <MarkdownRenderer
                        content={row.message}
                        className="text-xs text-gray-700 italic line-clamp-2"
                    />
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
                    {new Date(row.createdAt).toLocaleString()}
                </div>
            )
        },
        {
            header: 'Actions',
            accessor: (row: SupportTicket) => {
                const getActions = (): AdminAction[] => {
                    const actions: AdminAction[] = [];

                    if (row.topic === 'ACCOUNT_STATUS' && (row.organization?.status === OrgStatus.REJECTED || row.organization?.status === OrgStatus.SUSPENDED)) {
                        actions.push({
                            variant: 'approve',
                            onClick: () => handleApprove(row.organizationId, row.organization?.name || 'Organization'),
                            loading: actionLoading === `approve-${row.organizationId}`,
                            title: 'Approve Organization'
                        });
                    }

                    actions.push({
                        variant: 'resolve',
                        onClick: () => handleResolveTicket(row.id),
                        loading: actionLoading === `resolve-${row.id}`
                    });

                    return actions;
                };

                return (
                    <div className="flex justify-end pr-2">
                        <TableActions extraActions={getActions()} />
                    </div>
                );
            }
        }
    ];

    if (loading || (!user && !loading)) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const handleViewTicket = (ticket: SupportTicket) => {
        const viewFields: DataField[] = [
            { label: 'Ticket ID', value: ticket.id, icon: Hash, fullWidth: true },
            { label: 'Organization', value: ticket.organization?.name, icon: Building2 },
            { label: 'Topic', value: ticket.topic.replace('_', ' '), icon: Tag },
            {
                label: 'Message',
                value: <MarkdownRenderer content={ticket.message} className="text-sm bg-gray-50 p-4 rounded-sm border border-gray-100 min-h-[100px]" />,
                icon: Info,
                fullWidth: true
            },
            {
                label: 'Status', value: (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest ${ticket.isResolved ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                        {ticket.isResolved ? 'Resolved' : 'Open'}
                    </span>
                )
            },
            { label: 'Created At', value: new Date(ticket.createdAt).toLocaleString(), icon: Calendar },
        ];

        openViewModal({
            title: "Support Ticket Details",
            subtitle: ticket.organization?.name || 'Inquiry Details',
            fields: viewFields
        });
    };

    return (
        <div className="flex flex-col py-2 md:py-4 w-full animate-fade-in-up">
            <div className="bg-white/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/50 flex flex-col w-full overflow-hidden">
                <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex flex-col gap-6 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
                            <select
                                value={topicFilter}
                                onChange={(e) => updateQueryParams({ topic: e.target.value as SupportTopic | 'ALL', page: 1 })}
                                className="px-4 py-2.5 rounded-sm bg-white border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm min-w-[160px]"
                            >
                                <option value="ALL">All Topics</option>
                                <option value={SupportTopic.ACCOUNT_STATUS}>Account Status</option>
                                <option value={SupportTopic.GENERAL_SUPPORT}>General Support</option>
                                <option value={SupportTopic.BUG_ISSUE}>Bug/Issue</option>
                                <option value={SupportTopic.SUGGESTION}>Suggestion</option>
                            </select>

                            <SearchBar
                                value={searchQuery}
                                onChange={(val) => updateQueryParams({ search: val, page: 1 })}
                                placeholder="Search tickets..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-gray-50/10">
                    <DataTable
                        columns={columns}
                        data={filteredTickets}
                        keyExtractor={(row) => row.id}
                        isLoading={fetching}
                        onRowClick={handleViewTicket}
                        currentPage={paginatedData?.currentPage || 1}
                        totalPages={paginatedData?.totalPages || 1}
                        totalResults={paginatedData?.totalRecords || 0}
                        pageSize={10}
                        onPageChange={(p) => updateQueryParams({ page: p })}
                        sortConfig={{ key: sortBy, direction: sortOrder }}
                        onSort={(key, direction) => updateQueryParams({ sortBy: key, sortOrder: direction })}
                    />
                </div>
            </div>

        </div>
    );
}
