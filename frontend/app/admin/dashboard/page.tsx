'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Users,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    Search,
    Filter,
    Check,
    X,
    Building,
    MapPin,
    Mail,
    Calendar,
    Key,
    MessageSquare,
    CheckCircle2,
    Edit2,
    Trash2,
    UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { api, Organization, SupportTicket, AdminStats, PlatformAdmin } from '@/src/lib/api';


import { ModalForm } from '@/components/ui/ModalForm';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';



export default function AdminDashboardPage() {
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [platformAdmins, setPlatformAdmins] = useState<PlatformAdmin[]>([]);
    const [stats, setStats] = useState<AdminStats>({ PENDING: 0, APPROVED: 0, REJECTED: 0, SUSPENDED: 0, SUPPORT: 0, PLATFORM_ADMINS: 0 });
    const [fetching, setFetching] = useState(true);

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ORGANIZATIONS' | 'SUPPORT' | 'PLATFORM_ADMINS'>('ORGANIZATIONS');
    const [activeStatusTab, setActiveStatusTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [orgTypeFilter, setOrgTypeFilter] = useState<string>('ALL');
    const [topicFilter, setTopicFilter] = useState<string>('ALL');


    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [operatingOrg, setOperatingOrg] = useState<{ id: string, name: string } | null>(null);
    const [modalMode, setModalMode] = useState<'REJECT' | 'SUSPEND'>('REJECT');
    const [reason, setReason] = useState('');

    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [adminModalMode, setAdminModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [operatingAdmin, setOperatingAdmin] = useState<PlatformAdmin | null>(null);
    const [adminFormData, setAdminFormData] = useState({ name: '', email: '', password: '', phone: '' });
    const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (!loading && user && (user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN') && token) {
            fetchOrganizations();
        }
    }, [loading, user, activeTab, activeStatusTab, token]);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN')) {
        return null;
    }

    const fetchOrganizations = async () => {
        if (!token) return;
        try {
            setFetching(true);
            const [orgData, statsData] = await Promise.all([
                activeTab === 'SUPPORT'
                    ? api.admin.getSupportTickets(token)
                    : activeTab === 'PLATFORM_ADMINS'
                        ? api.admin.getPlatformAdmins(token)
                        : api.admin.getOrganizations(token, activeStatusTab as any),
                api.admin.getAdminStats(token)
            ]);

            if (activeTab === 'SUPPORT') {
                setSupportTickets((orgData as SupportTicket[]).filter(t => !t.isResolved));
            } else if (activeTab === 'PLATFORM_ADMINS') {
                setPlatformAdmins(orgData as PlatformAdmin[]);
            } else {
                setOrganizations(orgData as Organization[]);
            }
            setStats(statsData);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch data';
            showToast(message, 'error');
        } finally {
            setFetching(false);
        }
    };

    const fetchStats = async () => {
        if (!token) return;
        try {
            const data = await api.admin.getAdminStats(token);
            setStats(data);
        } catch (error) {
            // Silently fail stats fetch or handle as needed
        }
    };


    const handleResolveTicket = async (id: string) => {
        if (!token) return;
        try {
            setActionLoading(`resolve-${id}`);
            await api.admin.resolveSupportTicket(id, token);
            showToast('Ticket marked as resolved', 'success');
            setSupportTickets(prev => prev.filter(ticket => ticket.id !== id));
            fetchStats();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to resolve ticket';
            showToast(message, 'error');
        } finally {
            setActionLoading(null);
        }
    };


    const handleApprove = async (id: string, name: string) => {
        if (!token) return;
        try {
            setActionLoading(`approve-${id}`);
            await api.admin.approveOrganization(id, token);
            showToast(`${name} approved successfully`, 'success');
            if (activeTab === 'ORGANIZATIONS') {
                setOrganizations(prev => prev.filter(org => org.id !== id));
            }
            // Also need to update support tickets if we're in the support tab
            setSupportTickets(prev => prev.filter(ticket => ticket.organizationId !== id || ticket.topic !== 'ACCOUNT_STATUS'));
            fetchStats();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to approve organization';
            showToast(message, 'error');
        } finally {
            setActionLoading(null);
        }
    };



    const handleOpenModal = (id: string, name: string, mode: 'REJECT' | 'SUSPEND') => {
        setOperatingOrg({ id, name });
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!operatingOrg || !token) return;

        try {
            setActionLoading(`${modalMode.toLowerCase()}-${operatingOrg.id}`);
            if (modalMode === 'REJECT') {
                await api.admin.rejectOrganization(operatingOrg.id, reason, token);
                showToast(`${operatingOrg.name} rejected`, 'info');
            } else {
                await api.admin.suspendOrganization(operatingOrg.id, reason, token);
                showToast(`${operatingOrg.name} suspended`, 'info');
            }

            if (activeTab === 'ORGANIZATIONS') {
                setOrganizations(prev => prev.filter(org => org.id !== operatingOrg.id));
            }
            setSupportTickets(prev => prev.filter(ticket => ticket.organizationId !== operatingOrg.id || ticket.topic !== 'ACCOUNT_STATUS'));
            fetchStats();
            setIsModalOpen(false);

            setOperatingOrg(null);

            setReason('');
        } catch (error) {
            const message = error instanceof Error ? error.message : `Failed to ${modalMode.toLowerCase()} organization`;
            showToast(message, 'error');
        } finally {
            setActionLoading(null);
        }
    };



    const handleOpenAdminModal = (mode: 'CREATE' | 'EDIT', admin: PlatformAdmin | null = null) => {
        setAdminModalMode(mode);
        setOperatingAdmin(admin);
        if (mode === 'EDIT' && admin) {
            setAdminFormData({ name: admin.name, email: admin.email, password: '', phone: admin.phone || '' });
        } else {
            setAdminFormData({ name: '', email: '', password: '', phone: '' });
        }
        setIsAdminModalOpen(true);
    };

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            setActionLoading('admin-save');
            if (adminModalMode === 'CREATE') {
                const newAdmin = await api.admin.createPlatformAdmin(adminFormData, token);
                setPlatformAdmins(prev => [...prev, newAdmin]);
                showToast('Platform Admin created successfully', 'success');
            } else if (operatingAdmin) {
                const updatedAdmin = await api.admin.updatePlatformAdmin(operatingAdmin.id, {
                    name: adminFormData.name,
                    phone: adminFormData.phone,
                    ...(adminFormData.password ? { password: adminFormData.password } : {})
                }, token);
                setPlatformAdmins(prev => prev.map(a => a.id === updatedAdmin.id ? updatedAdmin : a));
                showToast('Platform Admin updated successfully', 'success');
            }
            setIsAdminModalOpen(false);
            fetchStats();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to save admin', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteAdmin = (admin: PlatformAdmin) => {
        setOperatingAdmin(admin);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!operatingAdmin || !token) return;

        try {
            setActionLoading(`delete-${operatingAdmin.id}`);
            await api.admin.deletePlatformAdmin(operatingAdmin.id, token);
            setPlatformAdmins(prev => prev.filter(admin => admin.id !== operatingAdmin.id));
            showToast(`${operatingAdmin.name} deleted successfully`, 'success');
            fetchStats();
            setIsDeleteModalOpen(false);
            setOperatingAdmin(null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to delete admin', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredOrganizations = organizations.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = orgTypeFilter === 'ALL' || org.type === orgTypeFilter;
        return matchesSearch && matchesType;
    });

    const filteredTickets = supportTickets.filter(ticket => {
        const matchesSearch = ticket.organization?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.organization?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTopic = topicFilter === 'ALL' || ticket.topic === topicFilter;
        return matchesSearch && matchesTopic;
    });

    const filteredAdmins = platformAdmins.filter(admin => {
        const matchesSearch = admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });







    const mainTabs = [
        { id: 'ORGANIZATIONS', label: 'Organizations', icon: Building, count: stats.PENDING + stats.APPROVED + stats.REJECTED + stats.SUSPENDED },
        { id: 'SUPPORT', label: 'Support Mails', icon: MessageSquare, count: stats.SUPPORT },
        ...(user?.role === 'SUPER_ADMIN' ? [{ id: 'PLATFORM_ADMINS', label: 'Platform Admins', icon: Users, count: stats.PLATFORM_ADMINS }] : []),
    ];

    const statusTabs = [
        { id: 'PENDING', label: 'Pending', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-600/10', count: stats.PENDING },
        { id: 'APPROVED', label: 'Approved', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-600/10', count: stats.APPROVED },
        { id: 'REJECTED', label: 'Rejected', icon: ShieldOff, color: 'text-red-600', bg: 'bg-red-600/10', count: stats.REJECTED },
        { id: 'SUSPENDED', label: 'Suspended', icon: ShieldAlert, color: 'text-gray-600', bg: 'bg-gray-600/10', count: stats.SUSPENDED },
    ];

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3 drop-shadow-xl">
                        <LayoutDashboard className="w-10 h-10" />
                        Admin Dashboard
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {user?.role === 'SUPER_ADMIN' && (
                        <button
                            onClick={() => handleOpenAdminModal('CREATE')}
                            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Admin</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    )}
                    <Link
                        href="/admin/change-password"
                        className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold hover:bg-white/20 transition-all flex items-center gap-2 shadow-lg"
                    >
                        <Key className="w-4 h-4" />
                        <span>Security</span>
                    </Link>
                    <div className="px-6 py-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold shadow-xl flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="opacity-80">Admin:</span>
                        <span className="text-indigo-100 truncate max-w-[200px]">{user.email}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden flex flex-col min-h-[600px]">
                {/* Dashboard Header/Tabs */}
                <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex flex-col gap-6 bg-gray-50/50">
                    {/* Primary Tabs */}
                    <div className="flex overflow-x-auto pb-2 -mb-2 bg-gray-200/50 rounded-2xl w-full scrollbar-none sm:flex-wrap p-1.5">
                        {mainTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 min-w-[140px] px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'opacity-40'}`} />
                                <span className="whitespace-nowrap">{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-300/50 text-gray-500'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Secondary Tabs (Only for Organizations) */}
                    {activeTab === 'ORGANIZATIONS' && (
                        <div className="flex overflow-x-auto pb-2 -mb-2 gap-2 scrollbar-none sm:flex-wrap">
                            {statusTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveStatusTab(tab.id as any)}
                                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm border whitespace-nowrap ${activeStatusTab === tab.id
                                        ? 'bg-white border-gray-200 text-gray-900'
                                        : 'bg-gray-100/50 border-transparent text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    <tab.icon className={`w-3 h-3 ${activeStatusTab === tab.id ? tab.color : 'opacity-40'}`} />
                                    <span>{tab.label}</span>
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${activeStatusTab === tab.id ? `${tab.bg} ${tab.color}` : 'bg-gray-200 text-gray-400'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {activeTab === 'SUPPORT' ? (
                                <select
                                    value={topicFilter}
                                    onChange={(e) => setTopicFilter(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="ALL">All Topics</option>
                                    <option value="ACCOUNT_STATUS">Account Status</option>
                                    <option value="GENERAL_SUPPORT">General Support</option>
                                    <option value="BUG_ISSUE">Bug/Issue</option>
                                    <option value="SUGGESTION">Suggestion</option>
                                </select>
                            ) : activeTab === 'ORGANIZATIONS' && (
                                <select
                                    value={orgTypeFilter}
                                    onChange={(e) => setOrgTypeFilter(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="ALL">All Org Types</option>
                                    <option value="HIGH_SCHOOL">High School</option>
                                    <option value="UNIVERSITY">University</option>
                                    <option value="PRIMARY_SCHOOL">Primary School</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            )}

                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder={activeTab === 'SUPPORT' ? "Search tickets..." : activeTab === 'PLATFORM_ADMINS' ? "Search admins..." : "Search organizations..."}
                            />
                        </div>
                    </div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto">
                    {fetching ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                                <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                            </div>
                            <p className="text-gray-500 font-bold animate-pulse">FACILITATING DATA...</p>
                        </div>
                    ) : (activeTab === 'SUPPORT' ? filteredTickets.length === 0 : (activeTab === 'PLATFORM_ADMINS' ? filteredAdmins.length === 0 : filteredOrganizations.length === 0)) ? (
                        <div className="p-20 text-center flex flex-col items-center max-w-md mx-auto">
                            <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                                <Search className="w-10 h-10 text-gray-300" />
                            </div>
                            <h4 className="text-2xl font-black text-gray-900 mb-2">No Results Found</h4>
                            <p className="text-gray-500 font-medium">
                                {searchQuery
                                    ? `We couldn't find any results matching "${searchQuery}".`
                                    : `There are currently no items in this section.`
                                }
                            </p>
                        </div>
                    ) : activeTab === 'SUPPORT' ? (
                        <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {filteredTickets.map((ticket) => (
                                <div key={ticket.id} className="group relative bg-white rounded-3xl p-6 border border-indigo-100 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shrink-0">
                                                    <MessageSquare className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xl font-black text-gray-900 leading-tight flex items-center gap-2 flex-wrap">
                                                        <span className="break-words min-w-0">{ticket.organization?.name}</span>
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md shrink-0 ${ticket.organization?.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                            ticket.organization?.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                                            }`}>
                                                            {ticket.organization?.status}
                                                        </span>
                                                    </h4>
                                                    <span className="text-xs font-bold text-gray-500 tracking-widest uppercase block truncate">{ticket.topic.replace('_', ' ')}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-2xl italic border border-gray-100">
                                                "{ticket.message}"
                                            </div>

                                            <div className="flex items-center text-xs font-bold text-gray-400 gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(ticket.createdAt).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center gap-2 relative z-10">
                                            {ticket.topic === 'ACCOUNT_STATUS' && (ticket.organization?.status === 'REJECTED' || ticket.organization?.status === 'SUSPENDED') && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(ticket.organizationId, ticket.organization?.name || 'Organization')}
                                                        disabled={actionLoading === `approve-${ticket.organizationId}`}
                                                        className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-4 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-emerald-100 overflow-hidden relative group/btn"
                                                    >
                                                        {actionLoading === `approve-${ticket.organizationId}` ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                                        ) : (
                                                            <>
                                                                <Check className="w-4 h-4" />
                                                                Approve Organization
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(ticket.organizationId, ticket.organization?.name || 'Organization', 'REJECT')}
                                                        className="w-full bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-4 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-gray-200"
                                                    >
                                                        <ShieldOff className="w-4 h-4" />
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(ticket.organizationId, ticket.organization?.name || 'Organization', 'SUSPEND')}
                                                        className="w-full bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 px-4 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-gray-200"
                                                    >
                                                        <ShieldAlert className="w-4 h-4" />
                                                        Suspend
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleResolveTicket(ticket.id)}
                                                disabled={actionLoading === `resolve-${ticket.id}`}
                                                className="w-full mt-auto bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-4 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-indigo-100"
                                            >
                                                {actionLoading === `resolve-${ticket.id}` ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Resolve
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'PLATFORM_ADMINS' ? (
                        <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {filteredAdmins.map((admin) => (
                                <div key={admin.id} className="group relative bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shrink-0">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xl font-black text-gray-900 leading-tight flex items-center gap-2 break-words">
                                                        {admin.name}
                                                    </h4>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block truncate">{admin.role.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm font-medium text-gray-600 gap-2">
                                                    <Mail className="w-4 h-4 text-purple-400" />
                                                    {admin.email}
                                                </div>
                                                {admin.phone && (
                                                    <div className="flex items-center text-sm font-medium text-gray-600 gap-2">
                                                        <MessageSquare className="w-4 h-4 text-purple-400" />
                                                        {admin.phone}
                                                    </div>
                                                )}
                                                <div className="flex items-center text-sm font-medium text-gray-500 gap-2 opacity-60">
                                                    <Calendar className="w-4 h-4" />
                                                    Added {new Date(admin.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 shrink-0 sm:items-end z-10 relative">
                                            {admin.id !== user.id && (
                                                <>
                                                    <button
                                                        onClick={() => handleOpenAdminModal('EDIT', admin)}
                                                        className="w-full sm:w-32 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAdmin(admin)}
                                                        disabled={actionLoading === `delete-${admin.id}`}
                                                        className="w-full sm:w-32 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                    >
                                                        {actionLoading === `delete-${admin.id}` ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                                                        ) : <Trash2 className="w-4 h-4" />}
                                                        Remove
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {filteredOrganizations.map((org) => (
                                <div key={org.id} className="group relative bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-start gap-4 min-w-0">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shrink-0">
                                                    <Building className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xl font-black text-gray-900 leading-tight break-words">{org.name}</h4>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block truncate">{org.type.replace('_', ' ')}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm font-medium text-gray-600 gap-2">
                                                    <MapPin className="w-4 h-4 text-indigo-400" />
                                                    {org.location}
                                                </div>
                                                <div className="flex items-center text-sm font-medium text-gray-600 gap-2">
                                                    <Mail className="w-4 h-4 text-indigo-400" />
                                                    {org.email}
                                                </div>
                                                <div className="flex items-center text-sm font-medium text-gray-500 gap-2 opacity-60">
                                                    <Calendar className="w-4 h-4" />
                                                    Since {new Date(org.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>

                                            {org.status === 'REJECTED' && org.statusMessage && (
                                                <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                                                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <ShieldOff className="w-3 h-3" />
                                                        Rejection Reason
                                                    </p>
                                                    <p className="text-sm text-red-700 font-medium italic">"{org.statusMessage}"</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 shrink-0 sm:items-end">
                                            {activeStatusTab === 'PENDING' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(org.id, org.name)}
                                                        disabled={actionLoading !== null}
                                                        className="w-full sm:w-32 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        {actionLoading === `approve-${org.id}` ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                        ) : <Check className="w-4 h-4" />}
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(org.id, org.name, 'REJECT')}
                                                        disabled={actionLoading !== null}
                                                        className="w-full sm:w-32 px-4 py-2.5 bg-white text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Reject
                                                    </button>
                                                </>
                                            ) : activeStatusTab === 'APPROVED' ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-xs flex items-center gap-2 border border-green-100 mb-1">
                                                        <ShieldCheck className="w-4 h-4" />
                                                        ACTIVE
                                                    </div>
                                                    <button
                                                        onClick={() => handleOpenModal(org.id, org.name, 'SUSPEND')}
                                                        disabled={actionLoading !== null}
                                                        className="w-full sm:w-32 px-4 py-2.5 bg-white text-orange-600 border border-orange-100 rounded-xl font-bold text-sm hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <ShieldAlert className="w-4 h-4" />
                                                        Suspend
                                                    </button>
                                                </div>
                                            ) : activeStatusTab === 'REJECTED' ? (
                                                <button
                                                    onClick={() => handleApprove(org.id, org.name)}
                                                    disabled={actionLoading !== null}
                                                    className="w-full sm:w-32 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading === `approve-${org.id}` ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                    ) : <Check className="w-4 h-4" />}
                                                    Re-approve
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleApprove(org.id, org.name)}
                                                    disabled={actionLoading !== null}
                                                    className="w-full sm:w-32 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading === `approve-${org.id}` ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                    ) : <Check className="w-4 h-4" />}
                                                    Unsuspend
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ModalForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                title={modalMode === 'REJECT' ? `Reject ${operatingOrg?.name}` : `Suspend ${operatingOrg?.name}`}
                submitText={modalMode === 'REJECT' ? 'Confirm Rejection' : 'Confirm Suspension'}
                variant={modalMode === 'REJECT' ? 'danger' : 'warning'}
                isSubmitting={actionLoading !== null}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 font-medium">
                        {modalMode === 'REJECT'
                            ? "Please provide a reason for rejecting this organization. They will see this message."
                            : "Please provide a reason for suspending this organization. They will see this message and their access will be restricted."
                        }
                    </p>
                    <textarea
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Type the reason here..."
                        className="w-full h-32 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 font-medium"
                    />
                </div>
            </ModalForm>

            <ModalForm
                isOpen={isAdminModalOpen}
                onClose={() => setIsAdminModalOpen(false)}
                onSubmit={handleAdminSubmit}
                title={adminModalMode === 'CREATE' ? 'Add New Platform Admin' : `Edit ${operatingAdmin?.name}`}
                submitText={adminModalMode === 'CREATE' ? 'Create Admin' : 'Save Changes'}
                isSubmitting={actionLoading === 'admin-save'}
            >
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Full Name</label>
                        <input
                            type="text"
                            required
                            value={adminFormData.name}
                            onChange={e => setAdminFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium"
                            placeholder="John Doe"
                        />
                    </div>
                    {adminModalMode === 'CREATE' && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Email Address</label>
                            <input
                                type="email"
                                required
                                value={adminFormData.email}
                                onChange={e => setAdminFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium"
                                placeholder="john@example.com"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Phone (Optional)</label>
                        <input
                            type="tel"
                            value={adminFormData.phone}
                            onChange={e => setAdminFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">
                            {adminModalMode === 'CREATE' ? 'Password' : 'New Password (Optional)'}
                        </label>
                        <input
                            type="password"
                            required={adminModalMode === 'CREATE'}
                            value={adminFormData.password}
                            onChange={e => setAdminFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full px-4 py-3 mb-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            </ModalForm>

            <ModalForm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onSubmit={handleConfirmDelete}
                title="Confirm Deletion"
                submitText="Delete Permanently"
                variant="danger"
                isSubmitting={actionLoading?.startsWith('delete-')}
            >
                <div className="space-y-4">
                    <p className="text-gray-600 font-medium">
                        Are you sure you want to remove <span className="font-bold text-gray-900">{operatingAdmin?.name}</span>? This action cannot be undone.
                    </p>
                </div>
            </ModalForm>
        </div >
    );
}
