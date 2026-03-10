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
import { useToast } from '@/context/ToastContext';
import { Section, Course } from '@/types';

export default function SectionsPage() {
    const { token, user } = useAuth();
    const pathname = usePathname();
    const { showToast } = useToast();
    const [sections, setSections] = useState<Section[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyMySections, setShowOnlyMySections] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', semester: '', year: '', room: '', courseId: '' });
    const [isSaving, setIsSaving] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingSection, setDeletingSection] = useState<Section | null>(null);

    const fetchSectionsAndCourses = useCallback(async () => {
        if (!token) return;
        try {
            const fetchPromises: Promise<Response>[] = [
                fetch('http://localhost:3000/org/sections', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:3000/org/courses', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ];

            const results = await Promise.all(fetchPromises);
            const sectionsData = await results[0].json();
            const coursesData = await results[1].json();

            setSections(Array.isArray(sectionsData) ? sectionsData : []);
            setCourses(Array.isArray(coursesData) ? coursesData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSectionsAndCourses();
    }, [fetchSectionsAndCourses]);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const submitData = { ...editFormData };

            const response = await fetch(`http://localhost:3000/org/sections/${editingSection?.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update section details');
            }
            setEditModalOpen(false);
            showToast('Section updated successfully', 'success');
            fetchSectionsAndCourses();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Error updating section', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingSection) return;
        try {
            const response = await fetch(`http://localhost:3000/org/sections/${deletingSection.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to delete section');
            }
            showToast('Section deleted permanently', 'success');
            setDeleteDialogOpen(false);
            fetchSectionsAndCourses();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Error deleting section', 'error');
        }
    };

    const filteredSections = sections.filter(section => {
        const matchesSearch =
            section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.room?.toLowerCase().includes(searchTerm.toLowerCase());

        const isMySection = user?.role === 'TEACHER' && section.teachers?.some(t => t.userId === (user.sub || user.id));
        const matchesFilter = !showOnlyMySections || isMySection;

        return matchesSearch && matchesFilter;
    });

    const columns = [
        {
            header: 'Section Name',
            sortable: true,
            sortAccessor: (row: Section) => row.name,
            accessor: (row: Section) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.name}</span>
                    <span className="text-sm font-medium text-indigo-600">{row.course?.name || 'No Course'}</span>
                </div>
            )
        },
        {
            header: 'Enrolled Teachers',
            sortable: true,
            sortAccessor: (row: Section) => row.teachers?.length || 0,
            accessor: (row: Section) => (
                <div className="flex flex-wrap gap-1">
                    {row.teachers && row.teachers.length > 0 ? (
                        row.teachers.map((teacher, idx) => (
                            <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-sm text-xs font-medium border border-indigo-100">
                                {teacher.user.name}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 italic text-sm">No teachers</span>
                    )}
                </div>
            )
        },
        {
            header: 'Term',
            sortable: true,
            sortAccessor: (row: Section) => `${row.semester} ${row.year}`,
            accessor: (row: Section) => row.semester && row.year ? `${row.semester} ${row.year}` : <span className="text-gray-400 italic">Unspecified</span>
        },
        {
            header: 'Room',
            sortable: true,
            accessor: (row: Section) => row.room || <span className="text-gray-400 italic">TBD</span>
        },
        {
            header: 'Actions',
            accessor: (row: Section) => {
                const isAdmin = user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER';
                const isAssignedTeacher = user?.role === 'TEACHER' && row.teachers?.some(t => t.userId === (user.sub || user.id));

                return (
                    <div className="flex gap-3">
                        {(isAdmin || isAssignedTeacher) && (
                            <button
                                onClick={() => {
                                    setEditingSection(row);
                                    setEditFormData({
                                        name: row.name,
                                        semester: row.semester || '',
                                        year: row.year || '',
                                        room: row.room || '',
                                        courseId: row.courseId || ''
                                    });
                                    setEditModalOpen(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded transition-colors"
                                title="Edit Section"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setDeletingSection(row);
                                    setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                                title="Delete Section"
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
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl">
                            <BookOpen className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg">Sections</h1>
                            <p className="text-indigo-100 font-bold opacity-90 mt-1">ACTIVE COURSE OFFERINGS</p>
                        </div>
                    </div>
                    {(user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER') && (
                        <Link
                            href={`/${orgSlug}/dashboard/sections/create`}
                            className="flex items-center gap-3 bg-white text-indigo-600 px-8 py-4 rounded-sm font-bold transition-all shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 active:scale-95"
                        >
                            <Plus className="w-6 h-6" />
                            Create Section
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8 mb-10">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 max-w-xl">
                        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, course, or room..." />
                    </div>

                    {user?.role === 'TEACHER' && (
                        <div className="flex items-center gap-3 bg-indigo-50/50 p-2 pr-4 rounded-sm border border-indigo-100">
                            <button
                                onClick={() => setShowOnlyMySections(!showOnlyMySections)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${showOnlyMySections ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOnlyMySections ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className="text-sm font-bold text-indigo-900 uppercase tracking-wider">My Sections</span>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <DataTable
                        data={filteredSections}
                        columns={columns}
                        keyExtractor={(row) => row.id}
                        isLoading={loading}
                    />
                </div>
            </div>

            <ModalForm
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Update Section Information"
                onSubmit={handleEditSubmit}
                isSubmitting={isSaving}
                submitText="Save Changes"
            >
                <div className="space-y-8 py-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Section Name *</label>
                        <input
                            type="text"
                            required
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-6 py-4 rounded-sm border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold"
                            placeholder="e.g. Section A"
                        />
                    </div>
                    {(user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER') && (
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Course</label>
                            <div className="relative group">
                                <select
                                    required
                                    value={editFormData.courseId}
                                    onChange={(e) => setEditFormData({ ...editFormData, courseId: e.target.value })}
                                    className="w-full px-6 py-4 rounded-sm border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold appearance-none"
                                >
                                    <option value="" disabled>Select Course</option>
                                    {courses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Semester</label>
                            <input
                                type="text"
                                value={editFormData.semester}
                                onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                                className="w-full px-6 py-4 rounded-sm border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold"
                                placeholder="E.g., Fall"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Year</label>
                            <input
                                type="text"
                                value={editFormData.year}
                                onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                                className="w-full px-6 py-4 rounded-sm border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold"
                                placeholder="E.g., 2026"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Room</label>
                        <input
                            type="text"
                            value={editFormData.room}
                            onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                            className="w-full px-6 py-4 rounded-sm border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-bold"
                            placeholder="E.g., 101-B"
                        />
                    </div>
                </div>
            </ModalForm>

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={<>Delete Section <strong>{deletingSection?.name}</strong></>}
                description={<>Are you sure you want to delete <strong>{deletingSection?.name}</strong>?</>}
                confirmText="Yes, Delete Section"
                isDestructive={true}
            />
        </div>
    );
}
