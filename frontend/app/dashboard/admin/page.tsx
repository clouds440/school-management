'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Check, X, Building, MapPin, Mail, Calendar } from 'lucide-react';
import { api, Organization } from '@/src/lib/api';

export default function AdminDashboardPage() {
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [fetching, setFetching] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchPendingOrganizations();
            }
        }
    }, [loading, user, router]);

    const fetchPendingOrganizations = async () => {
        if (!token) return;
        try {
            setFetching(true);
            const data = await api.admin.getPendingOrganizations(token);
            setOrganizations(data);
        } catch (error) {
            console.error('Error fetching organizations:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!token) return;
        try {
            setActionLoading(`approve-${id}`);
            await api.admin.approveOrganization(id, token);
            setOrganizations(prev => prev.filter(org => org.id !== id));
        } catch (error) {
            console.error('Error approving organization:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!token) return;
        if (!window.confirm('Are you sure you want to reject and delete this organization?')) return;

        try {
            setActionLoading(`reject-${id}`);
            await api.admin.rejectOrganization(id, token);
            setOrganizations(prev => prev.filter(org => org.id !== id));
        } catch (error) {
            console.error('Error rejecting organization:', error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading || (user && user.role !== 'admin')) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-300">Super Admin Dashboard</h1>
                    <p className="text-gray-400 mt-2">Manage pending school registrations</p>
                </div>
                <div className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 bg-white/70 shadow-sm flex items-center space-x-2">
                    <span className="text-gray-700">Admin:</span>
                    <span className="text-indigo-600 font-semibold truncate max-w-[200px]">{user.email}</span>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-white/50">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Pending Approvals
                    </h3>
                </div>

                {fetching ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : organizations.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Check className="w-12 h-12 text-green-400 mb-4" />
                        <p className="text-lg font-medium">All caught up!</p>
                        <p className="text-sm">There are no pending organizations right now.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {organizations.map((org) => (
                            <li key={org.id} className="p-6 hover:bg-white/60 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <h4 className="text-xl font-bold text-gray-900">{org.name}</h4>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                {org.type.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                {org.location}
                                            </div>
                                            <div className="flex items-center">
                                                <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                {org.email}
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                Registered {new Date(org.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3 shrink-0">
                                        <button
                                            onClick={() => handleReject(org.id)}
                                            disabled={actionLoading !== null}
                                            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                        >
                                            {actionLoading === `reject-${org.id}` ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-2 -ml-1"></div>
                                            ) : (
                                                <X className="-ml-1 mr-2 h-4 w-4" />
                                            )}
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(org.id)}
                                            disabled={actionLoading !== null}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                        >
                                            {actionLoading === `approve-${org.id}` ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 -ml-1"></div>
                                            ) : (
                                                <Check className="-ml-1 mr-2 h-4 w-4" />
                                            )}
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
