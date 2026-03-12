'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Pencil, Trash2, UserPlus } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Teacher, Role } from '@/types';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function TeachersPage() {
    const { token, user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { showToast } = useToast();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);

    useEffect(() => {
        if (user && user.role !== Role.ORG_ADMIN && user.role !== Role.ORG_MANAGER) {
            router.replace(`/${user.orgSlug || pathname.split('/')[1]}/dashboard`);
        }
    }, [user, router, pathname]);

    const fetchData = useCallback(async () => {
        if (!token || (user?.role !== Role.ORG_ADMIN && user?.role !== Role.ORG_MANAGER)) return;
        try {
            const data = await api.org.getTeachers(token);
            setTeachers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteConfirm = async () => {
        if (!deletingTeacher || !token) return;
        try {
            await api.org.deleteTeacher(deletingTeacher.id, token);
            showToast('Teacher removed from organization', 'success');
            setDeleteDialogOpen(false);
            fetchData();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Failed to delete teacher', 'error');
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.user.name && t.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.designation && t.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.department && t.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const columns = [
        {
            header: 'Teacher',
            sortable: true,
            sortAccessor: (row: Teacher) => row.user.name || row.user.email,
            accessor: (row: Teacher) => (
                <div>
                    <div className="font-semibold text-card-text">{row.user.name || 'No Name'}</div>
                    <div className="text-sm text-card-text/60">{row.user.email}</div>
                </div>
            )
        },
        {
            header: 'Role & Subject',
            sortable: true,
            sortAccessor: (row: Teacher) => row.designation || '',
            accessor: (row: Teacher) => (
                <div className="flex flex-col">
                    <span className="font-medium text-card-text/80">{row.designation || <span className="text-card-text/30 italic">No Designation</span>}</span>
                    <span className="text-sm text-card-text/60">{row.subject || 'No Subject'}</span>
                </div>
            )
        },
        {
            header: 'Assigned Sections',
            sortable: false,
            accessor: (row: Teacher) => {
                const sectionsList = row.sections || [];
                return sectionsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {sectionsList.map(sec => (
                            <span key={sec?.id || Math.random()} className="bg-primary/5 text-primary px-2 py-1 rounded-sm text-xs font-medium border border-primary/10 truncate max-w-[150px]" title={sec?.name}>
                                {sec?.name || 'Unknown'}
                            </span>
                        ))}
                    </div>
                ) : <span className="text-card-text/30 italic">Unassigned</span>;
            }
        },
        {
            header: 'Contact',
            sortable: true,
            sortAccessor: (row: Teacher) => row.user.phone || '',
            accessor: (row: Teacher) => row.user.phone || <span className="text-card-text/30 italic">-</span>
        },
        {
            header: 'Actions',
            accessor: (row: Teacher) => (
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push(`/${orgSlug}/dashboard/teachers/edit/${row.id}`)}
                        className="text-primary hover:text-white p-2.5 hover:bg-primary rounded-sm transition-all shadow-sm hover:shadow-[0_8px_16px_var(--shadow-color)] active:scale-90"
                        title="Edit Teacher"
                    >
                        <Pencil className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setDeletingTeacher(row);
                            setDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-white p-2.5 hover:bg-red-600 rounded-sm transition-all shadow-sm hover:shadow-red-200 active:scale-90"
                        title="Delete Teacher"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            )
        }
    ];

    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg text-left">Teachers</h1>
                            <p className="text-white/80 font-bold opacity-90 mt-1 uppercase tracking-widest text-[10px] text-left">ORGANIZATION FACULTY MANAGEMENT</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push(`/${orgSlug}/dashboard/teachers/add`)}
                        icon={UserPlus}
                        className="px-8 py-4"
                    >
                        Add Teacher
                    </Button>
                </div>
            </div>

            <div className="bg-card text-card-text rounded-sm shadow-[0_8px_30px_var(--shadow-color)] border border-white/20 p-6 md:p-8 mb-10">
                <div className="mb-10 flex">
                    <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, email or subject..." />
                </div>

                <div className="relative">
                    <DataTable
                        data={filteredTeachers}
                        columns={columns}
                        keyExtractor={(row) => row.id}
                        isLoading={loading}
                    />
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={<>Remove Faculty Member <strong>{deletingTeacher?.user?.name}</strong></>}
                description={<>Are you really sure you want to remove <strong>{deletingTeacher?.user?.email}</strong>? This action is permanent and cannot be reversed.</>}
                confirmText="Permanently Delete"
                isDestructive={true}
            />
        </div>
    );
}
