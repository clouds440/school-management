'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ModalForm } from '@/components/ui/ModalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BackButton } from '@/components/ui/BackButton';
import { useToast } from '@/context/ToastContext';
import { Class, Teacher } from '@/types';

export default function ClassesPage() {
    const { token, user } = useAuth();
    const pathname = usePathname();
    const { showToast } = useToast();
    const [classes, setClasses] = useState<Class[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyMyClasses, setShowOnlyMyClasses] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', description: '', grade: '', teacherId: '', courses: '' });
    const [isSaving, setIsSaving] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingClass, setDeletingClass] = useState<Class | null>(null);

    const fetchClassesAndTeachers = useCallback(async () => {
        if (!token) return;
        try {
            const fetchPromises: Promise<Response>[] = [
                fetch('http://localhost:3000/org/classes', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ];

            // Only admins should fetch the full teacher list
            if (user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER') {
                fetchPromises.push(
                    fetch('http://localhost:3000/org/teachers', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                );
            }

            const results = await Promise.all(fetchPromises);
            const classesData = await results[0].json();
            setClasses(Array.isArray(classesData) ? classesData : []);

            if ((user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER') && results[1]) {
                const teachersData = await results[1].json();
                setTeachers(Array.isArray(teachersData) ? teachersData : []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchClassesAndTeachers();
    }, [fetchClassesAndTeachers]);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const submitData: Record<string, string | string[]> = { ...editFormData };
            if (!submitData.teacherId) delete submitData.teacherId;
            if (!submitData.grade) delete submitData.grade;

            submitData.courses = typeof submitData.courses === 'string'
                ? submitData.courses.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
                : [];

            const response = await fetch(`http://localhost:3000/org/classes/${editingClass?.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update class details');
            }
            setEditModalOpen(false);
            showToast('Class updated successfully', 'success');
            fetchClassesAndTeachers();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Error updating class', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingClass) return;
        try {
            const response = await fetch(`http://localhost:3000/org/classes/${deletingClass.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to delete class');
            }
            showToast('Class deleted permanently', 'success');
            setDeleteDialogOpen(false);
            fetchClassesAndTeachers();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Error deleting class', 'error');
        }
    };

    const filteredClasses = classes.filter(cls => {
        const matchesSearch =
            cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.teacher?.user.name.toLowerCase().includes(searchTerm.toLowerCase());

        const isMyClass = user?.role === 'TEACHER' && cls.teacher?.userId === (user.sub || user.id);
        const matchesFilter = !showOnlyMyClasses || isMyClass;

        return matchesSearch && matchesFilter;
    });

    const columns = [
        {
            header: 'Class & Grade',
            accessor: (row: Class) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.name}</span>
                    <span className="text-sm font-medium text-indigo-600">{row.grade || 'No Grade'}</span>
                </div>
            )
        },
        {
            header: 'Courses',
            accessor: (row: Class) => (
                <div className="flex flex-wrap gap-1">
                    {row.courses && row.courses.length > 0 ? (
                        row.courses.map((course, idx) => (
                            <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium border border-indigo-100">
                                {course}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 italic text-sm">No courses</span>
                    )}
                </div>
            )
        },
        { header: 'Description', accessor: (row: Class) => row.description || <span className="text-gray-400 italic">No description</span> },
        {
            header: 'Assigned Teacher',
            accessor: (row: Class) => row.teacher ? (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{row.teacher.user.name || row.teacher.user.email}</span>
                    <span className="text-sm text-gray-500">{row.teacher.education || row.teacher.designation || 'Faculty'}</span>
                </div>
            ) : <span className="text-gray-400 italic text-sm">Unassigned</span>
        },
        {
            header: 'Last Updated',
            accessor: (row: Class) => row.updatedBy ? (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{row.updatedBy}</span>
                    <span className="text-xs text-gray-500">{new Date(row.updatedAt || '').toLocaleDateString()}</span>
                </div>
            ) : <span className="text-gray-400 italic text-sm text-center">Never</span>
        },
        {
            header: 'Actions',
            accessor: (row: Class) => {
                const isAdmin = user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER';
                const isAssignedTeacher = user?.role === 'TEACHER' && row.teacher && (row.teacher.userId === user.sub || row.teacher.userId === user.id);

                return (
                    <div className="flex gap-3">
                        {(isAdmin || isAssignedTeacher) && (
                            <button
                                onClick={() => {
                                    setEditingClass(row);
                                    setEditFormData({
                                        name: row.name,
                                        description: row.description || '',
                                        grade: row.grade || '',
                                        teacherId: row.teacherId || '',
                                        courses: row.courses?.join(', ') || ''
                                    });
                                    setEditModalOpen(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded transition-colors"
                                title="Edit Class"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setDeletingClass(row);
                                    setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                                title="Delete Class"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                );
            }
        }
    ];

    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8">
                <BackButton />
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 shadow-xl">
                            <BookOpen className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg">Classes</h1>
                            <p className="text-indigo-100 font-bold opacity-90 mt-1">CURRICULUM & COURSE MANAGEMENT</p>
                        </div>
                    </div>
                    {(user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER') && (
                        <Link
                            href={`/${orgSlug}/dashboard/classes/create`}
                            className="flex items-center gap-3 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold transition-all shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 active:scale-95"
                        >
                            <Plus className="w-6 h-6" />
                            Create Class
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/50 p-10 mb-10 overflow-hidden">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 max-w-xl">
                        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, teacher or description..." />
                    </div>

                    {user?.role === 'TEACHER' && (
                        <div className="flex items-center gap-3 bg-indigo-50/50 p-2 pr-4 rounded-2xl border border-indigo-100">
                            <button
                                onClick={() => setShowOnlyMyClasses(!showOnlyMyClasses)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${showOnlyMyClasses ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOnlyMyClasses ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className="text-sm font-bold text-indigo-900 uppercase tracking-wider">My Classes</span>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <DataTable
                        data={filteredClasses}
                        columns={columns}
                        keyExtractor={(row) => row.id}
                        isLoading={loading}
                    />
                </div>
            </div>

            <ModalForm
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Update Class Information"
                onSubmit={handleEditSubmit}
                isSubmitting={isSaving}
                submitText="Save Changes"
            >
                <div className="space-y-8 py-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Class Name *</label>
                        <input
                            type="text"
                            required
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold"
                            placeholder="e.g. Grade 10 - Science"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Grade / Class Level</label>
                        <input
                            type="text"
                            value={editFormData.grade}
                            onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold"
                            placeholder="E.g., 10th Grade"
                        />
                    </div>
                    {(user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER') && (
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Assigned Teacher</label>
                            <div className="relative group">
                                <select
                                    value={editFormData.teacherId}
                                    onChange={(e) => setEditFormData({ ...editFormData, teacherId: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold appearance-none"
                                >
                                    <option value="">Unassigned</option>
                                    {teachers.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.user.name || t.user.email} ({t.subject || 'Faculty'})
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-400">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Courses (comma-separated)</label>
                        <input
                            type="text"
                            value={editFormData.courses}
                            onChange={(e) => setEditFormData({ ...editFormData, courses: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold"
                            placeholder="E.g., Math, Science, English"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Description</label>
                        <textarea
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[120px] text-gray-900 font-bold resize-none"
                            placeholder="Briefly describe this class..."
                        />
                    </div>
                </div>
            </ModalForm>

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={<>Delete Class <strong>{deletingClass?.name}</strong></>}
                description={<>Are you sure you want to delete <strong>{deletingClass?.name}</strong>? All associated students will be unassigned from this class.</>}
                confirmText="Yes, Delete Class"
                isDestructive={true}
            />
        </div>
    );
}
