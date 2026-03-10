'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Plus, Edit2, Trash2, UserPlus } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ModalForm } from '@/components/ui/ModalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/BackButton';
import { useToast } from '@/context/ToastContext';
import { Teacher } from '@/types';
import { Button } from '@/components/ui/Button';

export default function TeachersPage() {
    const { token, user } = useAuth();
    const pathname = usePathname();
    const router = useRouter(); // Import useRouter
    const { showToast } = useToast();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        phone: '',
        education: '',
        designation: '',
        salary: '',
        subject: '',
        department: '',
        joiningDate: '',
        address: '',
        emergencyContact: '',
        bloodGroup: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);

    useEffect(() => {
        if (user && user.role !== 'ORG_ADMIN' && user.role !== 'ORG_MANAGER') {
            router.replace(`/${user.orgSlug || pathname.split('/')[1]}/dashboard`);
        }
    }, [user, router, pathname]);

    const fetchTeachers = useCallback(async () => {
        if (!token || (user?.role !== 'ORG_ADMIN' && user?.role !== 'ORG_MANAGER')) return;
        try {
            const res = await fetch('http://localhost:3000/org/teachers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setTeachers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTeacher) return;
        setIsSaving(true);
        try {
            const response = await fetch(`http://localhost:3000/org/teachers/${editingTeacher.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editFormData.name || null,
                    phone: editFormData.phone || null,
                    education: editFormData.education || null,
                    designation: editFormData.designation || null,
                    salary: Number(editFormData.salary) || null,
                    subject: editFormData.subject || null,
                    department: editFormData.department || null,
                    joiningDate: editFormData.joiningDate || null,
                    address: editFormData.address || null,
                    emergencyContact: editFormData.emergencyContact || null,
                    bloodGroup: editFormData.bloodGroup || null
                })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update teacher profile');
            }
            setEditModalOpen(false);
            showToast('Teacher profile updated successfully', 'success');
            fetchTeachers();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Error occurred while updating', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingTeacher) return;
        try {
            const response = await fetch(`http://localhost:3000/org/teachers/${deletingTeacher.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to delete teacher');
            }
            showToast('Teacher removed from organization', 'success');
            setDeleteDialogOpen(false);
            fetchTeachers();
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
                    <div className="font-semibold text-gray-900">{row.user.name || 'No Name'}</div>
                    <div className="text-sm text-gray-500">{row.user.email}</div>
                </div>
            )
        },
        {
            header: 'Role & Subject',
            sortable: true,
            sortAccessor: (row: Teacher) => row.designation || '',
            accessor: (row: Teacher) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{row.designation || <span className="text-gray-400 italic">No Designation</span>}</span>
                    <span className="text-sm text-gray-500">{row.subject || 'No Subject'}</span>
                </div>
            )
        },
        {
            header: 'Education',
            sortable: true,
            accessor: (row: Teacher) => row.education || <span className="text-gray-400 italic">-</span>
        },
        {
            header: 'Contact',
            sortable: true,
            sortAccessor: (row: Teacher) => row.user.phone || '',
            accessor: (row: Teacher) => row.user.phone || <span className="text-gray-400 italic">-</span>
        },
        {
            header: 'Salary',
            sortable: true,
            sortAccessor: (row: Teacher) => row.salary || 0,
            accessor: (row: Teacher) => row.salary ? `$${row.salary}` : <span className="text-gray-400 italic">Not set</span>
        },
        {
            header: 'Actions',
            accessor: (row: Teacher) => (
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setEditingTeacher(row);
                            setEditFormData({
                                name: row.user.name || '',
                                phone: row.user.phone || '',
                                education: row.education || '',
                                designation: row.designation || '',
                                salary: row.salary ? String(row.salary) : '',
                                subject: row.subject || '',
                                department: row.department || '',
                                joiningDate: row.joiningDate ? row.joiningDate.split('T')[0] : '',
                                address: row.address || '',
                                emergencyContact: row.emergencyContact || '',
                                bloodGroup: row.bloodGroup || ''
                            });
                            setEditModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-white p-2.5 hover:bg-indigo-600 rounded-xl transition-all shadow-sm hover:shadow-indigo-200 active:scale-90"
                        title="Edit Teacher"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setDeletingTeacher(row);
                            setDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-white p-2.5 hover:bg-red-600 rounded-xl transition-all shadow-sm hover:shadow-red-200 active:scale-90"
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
        <div className="flex flex-1 flex-col p-6 sm:p-10 w-full animate-fade-in-up">
            <div className="mb-8">
                <BackButton />
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 shadow-xl">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg">Teachers</h1>
                            <p className="text-indigo-100 font-bold opacity-90 mt-1">ORGANIZATION FACULTY MANAGEMENT</p>
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

            <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-white/50 p-12 mb-10 overflow-hidden animate-fade-in-up">
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

            <ModalForm
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Update Faculty Profile"
                onSubmit={handleEditSubmit}
                isSubmitting={isSaving}
                submitText="Save Changes"
            >
                <div className="space-y-8 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Full Name</label>
                            <input
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Phone Number</label>
                            <input
                                type="text"
                                value={editFormData.phone}
                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Education</label>
                            <input
                                type="text"
                                value={editFormData.education}
                                onChange={(e) => setEditFormData({ ...editFormData, education: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                                placeholder="M.S. Computer Science"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Designation</label>
                            <input
                                type="text"
                                value={editFormData.designation}
                                onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                                placeholder="Senior Teacher"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Specialization / Subject</label>
                            <input
                                type="text"
                                value={editFormData.subject}
                                onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                                placeholder="e.g. Mathematics"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Annual Salary ($)</label>
                            <input
                                type="number"
                                value={editFormData.salary}
                                onChange={(e) => setEditFormData({ ...editFormData, salary: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Department</label>
                            <input
                                type="text"
                                value={editFormData.department}
                                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                                placeholder="e.g. Science"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Joining Date</label>
                            <input
                                type="date"
                                value={editFormData.joiningDate}
                                onChange={(e) => setEditFormData({ ...editFormData, joiningDate: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Residential Address</label>
                            <input
                                type="text"
                                value={editFormData.address}
                                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                                placeholder="123 Main St, City, Country"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Emergency Contact</label>
                            <input
                                type="text"
                                value={editFormData.emergencyContact}
                                onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                                placeholder="Name - Relationship - Phone"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Blood Group</label>
                            <input
                                type="text"
                                value={editFormData.bloodGroup}
                                onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400"
                                placeholder="O+, A-, etc."
                            />
                        </div>
                    </div>
                </div>
            </ModalForm>

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
