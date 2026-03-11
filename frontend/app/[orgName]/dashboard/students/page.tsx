'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Users, Pencil, Trash2, BookOpen, ShieldCheck, GraduationCap, UserX } from 'lucide-react';
import { ModalForm } from '@/components/ui/ModalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Student, Section } from '@/types';
import { Select } from '@/components/ui/Select';

export default function StudentsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];
    const { showToast } = useToast();

    const [students, setStudents] = useState<Student[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyMyStudents, setShowOnlyMyStudents] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [editFormData, setEditFormData] = useState({
        name: '',
        phone: '',
        registrationNumber: '',
        fatherName: '',
        fee: '',
        age: '',
        address: '',
        major: '',
        sectionIds: [] as string[],
        department: '',
        admissionDate: '',
        graduationDate: '',
        gender: '',
        bloodGroup: '',
        emergencyContact: '',
        feePlan: '',
        status: 'ACTIVE'
    });

    useEffect(() => {
        if (token) {
            fetchStudents();
            fetchSections();
        }
    }, [token]);

    const fetchStudents = async () => {
        try {
            const response = await fetch('http://localhost:3000/org/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            showToast('Failed to load students data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSections = async () => {
        try {
            const response = await fetch('http://localhost:3000/org/sections', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSections(data);
            }
        } catch (error) {
            console.error('Failed to load sections', error);
        }
    };

    const filteredStudents = students.filter((student: Student) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            student.user?.name?.toLowerCase().includes(search) ||
            student.registrationNumber?.toLowerCase().includes(search) ||
            student.major?.toLowerCase().includes(search) ||
            student.department?.toLowerCase().includes(search);

        const loggedInUserId = user?.sub || user?.id;
        const isMyStudent = student.enrollments?.some(e =>
            e.section?.teachers?.some(t => t.userId === loggedInUserId)
        );
        const matchesFilter = !showOnlyMyStudents || isMyStudent;

        return matchesSearch && matchesFilter;
    });

    const columns: Column<Student>[] = [
        {
            header: 'Student Name',
            sortable: true,
            sortAccessor: (row: Student) => row.user.name || '',
            accessor: (row: Student) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                        {(row.user.name || 'N').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-900">{row.user.name || 'N/A'}</span>
                </div>
            )
        },
        {
            header: 'Reg No.',
            sortable: true,
            accessor: (row: Student) => row.registrationNumber || '-'
        },
        {
            header: 'Major / Course',
            sortable: true,
            accessor: (row: Student) => row.major || '-'
        },
        {
            header: 'Contact',
            sortable: true,
            sortAccessor: (row: Student) => row.user.phone || row.user.email || '',
            accessor: (row: Student) => (
                <div className="flex flex-col">
                    <span className="text-gray-700">{row.user.phone || 'No phone'}</span>
                    <span className="text-xs text-gray-500">{row.user.email}</span>
                </div>
            )
        },
        {
            header: 'Enrolled Sections',
            sortable: false,
            accessor: (row: Student) => {
                const sectionsList = row.enrollments?.map(e => e.section) || [];
                return sectionsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {sectionsList.map(sec => (
                            <span key={sec?.id || Math.random()} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-sm text-xs font-medium border border-indigo-100 truncate max-w-[150px]" title={sec?.name}>
                                {sec?.name || 'Unknown'}
                            </span>
                        ))}
                    </div>
                ) : <span className="text-gray-400 italic">Unassigned</span>;
            }
        },
        {
            header: 'Fee / Age',
            sortable: true,
            sortAccessor: (row: Student) => row.fee || 0,
            accessor: (row: Student) => (
                <div className="whitespace-nowrap">
                    {row.fee ? `$${row.fee}` : '-'} / {row.age ? `${row.age} yrs` : '-'}
                </div>
            )
        },
        {
            header: 'Last Updated',
            sortable: true,
            sortAccessor: (row: Student) => new Date(row.updatedAt || '').getTime(),
            accessor: (row: Student) => row.updatedBy ? (
                <div className="flex flex-col whitespace-nowrap">
                    <span className="font-medium text-gray-800">{row.updatedBy}</span>
                    <span className="text-xs text-gray-500">{new Date(row.updatedAt || '').toLocaleDateString()}</span>
                </div>
            ) : <span className="text-gray-400 italic text-sm text-center">Never</span>
        },
        {
            header: 'Actions',
            accessor: (row: Student) => (user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER' || user?.role === 'TEACHER') ? (
                <div className="flex justify-end gap-2 shrink-0">
                    <button
                        onClick={() => handleEditClick(row.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-sm transition-colors border border-transparent hover:border-indigo-100"
                        title="Edit Student"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-sm transition-colors border border-transparent hover:border-red-100"
                        title="Remove Student"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ) : null
        }
    ];

    const handleEditClick = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (student) {
            setSelectedStudent(student);
            setEditFormData({
                name: student.user?.name || '',
                phone: student.user?.phone || '',
                registrationNumber: student.registrationNumber || '',
                fatherName: student.fatherName || '',
                fee: student.fee?.toString() || '',
                age: student.age?.toString() || '',
                address: student.address || '',
                major: student.major || '',
                sectionIds: student.enrollments?.map(e => e.section?.id) || [],
                department: student.department || '',
                admissionDate: student.admissionDate ? student.admissionDate.split('T')[0] : '',
                graduationDate: student.graduationDate ? student.graduationDate.split('T')[0] : '',
                gender: student.gender || '',
                bloodGroup: student.bloodGroup || '',
                emergencyContact: student.emergencyContact || '',
                feePlan: student.feePlan || '',
                status: student.status || 'ACTIVE'
            });
            setIsEditModalOpen(true);
        }
    };

    const handleDeleteClick = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (student) {
            setSelectedStudent(student);
            setIsDeleteDialogOpen(true);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:3000/org/students/${selectedStudent?.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editFormData.name || undefined,
                    phone: editFormData.phone || undefined,
                    registrationNumber: editFormData.registrationNumber || undefined,
                    fatherName: editFormData.fatherName || undefined,
                    fee: editFormData.fee ? Number(editFormData.fee) : undefined,
                    age: editFormData.age ? Number(editFormData.age) : undefined,
                    address: editFormData.address || undefined,
                    major: editFormData.major || undefined,
                    sectionIds: editFormData.sectionIds,
                    department: editFormData.department || undefined,
                    admissionDate: editFormData.admissionDate || undefined,
                    graduationDate: editFormData.graduationDate || undefined,
                    gender: editFormData.gender || undefined,
                    bloodGroup: editFormData.bloodGroup || undefined,
                    emergencyContact: editFormData.emergencyContact || undefined,
                    feePlan: editFormData.feePlan || undefined,
                    status: editFormData.status
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update student');
            }

            showToast('Student record updated successfully', 'success');
            setIsEditModalOpen(false);
            fetchStudents();
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Failed to update student', 'error');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const response = await fetch(`http://localhost:3000/org/students/${selectedStudent?.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to delete student');
            }

            showToast('Student removed successfully', 'success');
            setIsDeleteDialogOpen(false);
            fetchStudents();
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Failed to delete student', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-1 md:px-2 py-2 md:py-4 w-full animate-fade-in-up">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm md:rounded-sm border border-white/30 shadow-xl shrink-0">
                            <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg text-left">Students</h1>
                            <p className="text-indigo-100 font-bold opacity-80 mt-1 text-sm md:text-base text-left">MANAGE ENROLLED LEARNERS</p>
                        </div>
                    </div>
                </div>

                {(user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER' || user?.role === 'TEACHER') && (
                    <button
                        onClick={() => router.push(`/${orgSlug}/dashboard/students/add`)}
                        className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 md:px-8 md:py-4 rounded-sm font-bold transition-all border border-white/30 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Student
                    </button>
                )}
            </div>

            <div className="bg-white rounded-sm md:rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-4 md:p-8 mb-10 overflow-hidden">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                    <div className="flex-1 max-w-xl">
                        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, registration or major..." />
                    </div>

                    {user?.role === 'TEACHER' && (
                        <div className="flex items-center gap-3 bg-indigo-50/50 p-2 pr-4 rounded-sm border border-indigo-100 self-start md:self-auto">
                            <button
                                onClick={() => setShowOnlyMyStudents(!showOnlyMyStudents)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${showOnlyMyStudents ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOnlyMyStudents ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">My Students</span>
                        </div>
                    )}
                </div>

                <div className="relative overflow-x-hidden">
                    <DataTable
                        data={filteredStudents}
                        columns={columns}
                        keyExtractor={(row) => row.id}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* Edit Modal */}
            <ModalForm
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Student Details"
                onSubmit={handleEditSubmit}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={editFormData.name}
                                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                value={editFormData.phone}
                                onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Registration #</label>
                            <input
                                type="text"
                                value={editFormData.registrationNumber}
                                onChange={e => setEditFormData({ ...editFormData, registrationNumber: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Major / Course</label>
                            <input
                                type="text"
                                value={editFormData.major}
                                onChange={e => setEditFormData({ ...editFormData, major: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Father's Name</label>
                            <input
                                type="text"
                                value={editFormData.fatherName}
                                onChange={e => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                            <input
                                type="number"
                                value={editFormData.age}
                                onChange={e => setEditFormData({ ...editFormData, age: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Fee Amount</label>
                            <input
                                type="number"
                                value={editFormData.fee}
                                onChange={e => setEditFormData({ ...editFormData, fee: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Home Address</label>
                        <textarea
                            value={editFormData.address}
                            onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                            className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                            <input
                                type="text"
                                value={editFormData.department}
                                onChange={e => setEditFormData({ ...editFormData, department: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Fee Plan Type</label>
                            <input
                                type="text"
                                value={editFormData.feePlan}
                                onChange={e => setEditFormData({ ...editFormData, feePlan: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Date</label>
                            <input
                                type="date"
                                value={editFormData.admissionDate}
                                onChange={e => setEditFormData({ ...editFormData, admissionDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Graduation</label>
                            <input
                                type="date"
                                value={editFormData.graduationDate}
                                onChange={e => setEditFormData({ ...editFormData, graduationDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                            <select
                                value={editFormData.gender}
                                onChange={e => setEditFormData({ ...editFormData, gender: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Blood Group</label>
                            <input
                                type="text"
                                value={editFormData.bloodGroup}
                                onChange={e => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Status</label>
                            <Select
                                value={editFormData.status}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                icon={
                                    editFormData.status === 'ACTIVE' ? ShieldCheck :
                                        editFormData.status === 'SUSPENDED' ? UserX :
                                            GraduationCap
                                }
                            >
                                <option value="ACTIVE" className="text-gray-900 font-bold">Active</option>
                                <option value="SUSPENDED" className="text-gray-900 font-bold">Suspended</option>
                                <option value="ALUMNI" className="text-gray-900 font-bold">Alumni</option>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact</label>
                            <input
                                type="text"
                                value={editFormData.emergencyContact}
                                onChange={e => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                                className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Enrolled Sections</label>
                        <select
                            multiple
                            value={editFormData.sectionIds}
                            onChange={e => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setEditFormData({ ...editFormData, sectionIds: selected });
                            }}
                            className="w-full px-4 py-2 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white min-h-[100px]"
                        >
                            {sections.map(sec => (
                                <option key={sec.id} value={sec.id}>
                                    {sec.name} {sec.course?.name ? `(${sec.course.name})` : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple sections.</p>
                    </div>
                </div>
            </ModalForm>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={<>Remove Student <strong>{selectedStudent?.user?.name}</strong></>}
                description={<>Are you sure you want to completely remove <strong>{selectedStudent?.user?.name || 'this student'}</strong>? This will also delete their login account.</>}
                confirmText="Yes, Remove Student"
                isDestructive={true}
            />
        </div>
    );
}
