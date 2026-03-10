'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Users, Pencil, Trash2, BookOpen } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { ModalForm } from '@/components/ui/ModalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/context/ToastContext';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Student, Class } from '@/types';

export default function StudentsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];
    const { showToast } = useToast();

    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
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
        classId: '',
        department: '',
        admissionDate: '',
        graduationDate: '',
        gender: '',
        bloodGroup: '',
        emergencyContact: '',
        feePlan: ''
    });

    useEffect(() => {
        if (token) {
            fetchStudents();
            fetchClasses();
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

    const fetchClasses = async () => {
        try {
            const response = await fetch('http://localhost:3000/org/classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setClasses(data);
            }
        } catch (error) {
            console.error('Failed to load classes', error);
        }
    };

    // Filter students
    const filteredStudents = students.filter((student: Student) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            student.user?.name?.toLowerCase().includes(search) ||
            student.registrationNumber?.toLowerCase().includes(search) ||
            student.major?.toLowerCase().includes(search) ||
            student.department?.toLowerCase().includes(search);

        // A student is "mine" if they belong to a class where I am the teacher
        const teacherUserId = student.class?.teacher?.userId;
        const loggedInUserId = user?.sub || user?.id;
        const isMyStudent = teacherUserId && loggedInUserId && teacherUserId === loggedInUserId;
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
            header: 'Enrolled Classes',
            sortable: true,
            sortAccessor: (row: Student) => row.class?.name || '',
            accessor: (row: Student) => row.class ? (
                <div className="max-w-[200px] truncate" title={`${row.class.name} ${row.class.courses && row.class.courses.length > 0 ? `(${row.class.courses.length} courses)` : ''}`}>
                    {row.class.name} {row.class.courses && row.class.courses.length > 0 ? `(${row.class.courses.length} courses)` : ''}
                </div>
            ) : <span className="text-gray-400 italic">Unassigned</span>
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
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        title="Edit Student"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
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
                classId: student.class?.id || '',
                department: student.department || '',
                admissionDate: student.admissionDate ? student.admissionDate.split('T')[0] : '',
                graduationDate: student.graduationDate ? student.graduationDate.split('T')[0] : '',
                gender: student.gender || '',
                bloodGroup: student.bloodGroup || '',
                emergencyContact: student.emergencyContact || '',
                feePlan: student.feePlan || ''
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
                    classId: editFormData.classId || undefined,
                    department: editFormData.department || undefined,
                    admissionDate: editFormData.admissionDate || undefined,
                    graduationDate: editFormData.graduationDate || undefined,
                    gender: editFormData.gender || undefined,
                    bloodGroup: editFormData.bloodGroup || undefined,
                    emergencyContact: editFormData.emergencyContact || undefined,
                    feePlan: editFormData.feePlan || undefined
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
        <div className="flex flex-1 flex-col p-6 sm:p-10 w-full animate-fade-in-up">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <BackButton />
                    <div className="mt-8 flex items-center gap-5">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">Students</h1>
                            <p className="text-indigo-100 font-bold opacity-80 mt-1">MANAGE ENROLLED LEARNERS</p>
                        </div>
                    </div>
                </div>

                {(user?.role === 'ORG_ADMIN' || user?.role === 'ORG_MANAGER' || user?.role === 'TEACHER') && (
                    <button
                        onClick={() => router.push(`/${orgSlug}/dashboard/students/add`)}
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/30 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Student
                    </button>
                )}
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/50 p-10 mb-10 overflow-hidden">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 max-w-xl">
                        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, registration or major..." />
                    </div>

                    {user?.role === 'TEACHER' && (
                        <div className="flex items-center gap-3 bg-indigo-50/50 p-2 pr-4 rounded-2xl border border-indigo-100">
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
                            <span className="text-sm font-bold text-indigo-900 uppercase tracking-wider">My Students</span>
                        </div>
                    )}
                </div>

                <div className="relative">
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
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                value={editFormData.phone}
                                onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Major / Course</label>
                            <input
                                type="text"
                                value={editFormData.major}
                                onChange={e => setEditFormData({ ...editFormData, major: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                            <input
                                type="number"
                                value={editFormData.age}
                                onChange={e => setEditFormData({ ...editFormData, age: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Fee Amount</label>
                            <input
                                type="number"
                                value={editFormData.fee}
                                onChange={e => setEditFormData({ ...editFormData, fee: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Home Address</label>
                        <textarea
                            value={editFormData.address}
                            onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Fee Plan Type</label>
                            <input
                                type="text"
                                value={editFormData.feePlan}
                                onChange={e => setEditFormData({ ...editFormData, feePlan: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Graduation</label>
                            <input
                                type="date"
                                value={editFormData.graduationDate}
                                onChange={e => setEditFormData({ ...editFormData, graduationDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                            <select
                                value={editFormData.gender}
                                onChange={e => setEditFormData({ ...editFormData, gender: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
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
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact</label>
                        <input
                            type="text"
                            value={editFormData.emergencyContact}
                            onChange={e => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned Class/Grade</label>
                        <select
                            value={editFormData.classId}
                            onChange={e => setEditFormData({ ...editFormData, classId: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                        >
                            <option value="">Unassigned</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name} {cls.grade ? `(${cls.grade})` : ''} - {cls.courses?.length || 0} courses
                                </option>
                            ))}
                        </select>
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
            />
        </div>
    );
}
