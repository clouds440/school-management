'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Check, MessageSquare, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { SupportTicket } from '@/types';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';

export default function SupportPage() {
    const { user, token, loading } = useAuth();
    const { showToast } = useToast();

    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [fetching, setFetching] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [topicFilter, setTopicFilter] = useState<string>('ALL');

    useEffect(() => {
        if (!loading && user && (user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN') && token) {
            fetchTickets();
        }
    }, [loading, user, token]);

    const fetchTickets = async () => {
        if (!token) return;
        try {
            setFetching(true);
            const ticketData = await api.admin.getSupportTickets(token);
            setTickets((ticketData as SupportTicket[]).filter(t => !t.isResolved));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch data';
            showToast(message, 'error');
        } finally {
            setFetching(false);
        }
    };

    const handleResolveTicket = async (id: string) => {
        if (!token) return;
        try {
            setActionLoading(`resolve-${id}`);
            await api.admin.resolveSupportTicket(id, token);
            showToast('Ticket marked as resolved', 'success');
            setTickets(prev => prev.filter(ticket => ticket.id !== id));
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
            setTickets(prev => prev.filter(ticket => ticket.organizationId !== id || ticket.topic !== 'ACCOUNT_STATUS'));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to approve organization';
            showToast(message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.organization?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.organization?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTopic = topicFilter === 'ALL' || ticket.topic === topicFilter;
        return matchesSearch && matchesTopic;
    });

    const columns: Column<SupportTicket>[] = [
        {
            header: 'Organization',
            sortable: true,
            sortAccessor: (row) => row.organization?.name || '',
            accessor: (row) => (
                <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 rounded-sm flex items-center justify-center text-indigo-600 shrink-0">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-gray-900 leading-tight wrap-break-word flex items-center gap-2">
                            {row.organization?.name}
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${row.organization?.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                row.organization?.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
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
                <div className="text-xs text-gray-700 bg-gray-50/50 p-3 rounded-sm border border-gray-100 italic wrap-break-word max-w-sm">
                    "{row.message}"
                </div>
            )
        },
        {
            header: 'Date',
            sortable: true,
            sortAccessor: (row) => new Date(row.createdAt).getTime(),
            accessor: (row) => (
                <div className="flex items-center text-xs font-medium text-gray-500 gap-1.5 opacity-80">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.createdAt).toLocaleString()}
                </div>
            )
        },
        {
            header: 'Actions',
            accessor: (row) => (
                <div className="flex flex-col gap-2 shrink-0 sm:items-end w-40">
                    {row.topic === 'ACCOUNT_STATUS' && (row.organization?.status === 'REJECTED' || row.organization?.status === 'SUSPENDED') && (
                        <button
                            onClick={() => handleApprove(row.organizationId, row.organization?.name || 'Organization')}
                            disabled={actionLoading === `approve-${row.organizationId}`}
                            className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-sm font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-emerald-100"
                        >
                            {actionLoading === `approve-${row.organizationId}` ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                            ) : (
                                <>
                                    <Check className="w-3 h-3" />
                                    Approve Org
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => handleResolveTicket(row.id)}
                        disabled={actionLoading === `resolve-${row.id}`}
                        className="w-full mt-auto bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-3 py-2 rounded-sm font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-indigo-100"
                    >
                        {actionLoading === `resolve-${row.id}` ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                        ) : (
                            <>
                                <CheckCircle2 className="w-3 h-3" />
                                Resolve
                            </>
                        )}
                    </button>
                </div>
            )
        }
    ];

    if (loading || (!user && !loading)) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl shrink-0">
                        <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight text-left">Support Mails</h1>
                        <p className="text-gray-500 font-bold opacity-80 mt-1 text-sm md:text-base text-left uppercase tracking-wider">Inquiries & Ticket Resolution</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-2xl rounded-sm shadow-xl border border-white/50 flex flex-col w-full overflow-hidden">
                <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex flex-col gap-6 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
                            <select
                                value={topicFilter}
                                onChange={(e) => setTopicFilter(e.target.value)}
                                className="px-4 py-2.5 rounded-sm bg-white border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm min-w-[160px]"
                            >
                                <option value="ALL">All Topics</option>
                                <option value="ACCOUNT_STATUS">Account Status</option>
                                <option value="GENERAL_SUPPORT">General Support</option>
                                <option value="BUG_ISSUE">Bug/Issue</option>
                                <option value="SUGGESTION">Suggestion</option>
                            </select>

                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
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
                    />
                </div>
            </div>
        </div>
    );
}
