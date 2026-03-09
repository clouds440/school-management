'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { UserPlus, User, Mail, Lock, Phone, MapPin, Hash, BookOpen, GraduationCap, DollarSign } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { Class } from '@/types';

export default function AddStudentPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    // Redirect if not authorized
    useEffect(() => {
        if (user && user.role !== 'ORG_ADMIN' && user.role !== 'ORG_MANAGER' && user.role !== 'TEACHER') {
            router.push(`/${orgSlug}/dashboard`);
        }
    }, [user, orgSlug, router]);

    const [classes, setClasses] = useState<Class[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        registrationNumber: '',
        fatherName: '',
        fee: '',
        age: '',
        address: '',
        major: '',
        classId: ''
    });

    useEffect(() => {
        if (token) fetchClasses();
    }, [token]);

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
            console.error('Failed to fetch classes', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await fetch('http://localhost:3000/org/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone || undefined,
                    registrationNumber: formData.registrationNumber || undefined,
                    fatherName: formData.fatherName || undefined,
                    fee: formData.fee ? Number(formData.fee) : undefined,
                    age: formData.age ? Number(formData.age) : undefined,
                    address: formData.address || undefined,
                    major: formData.major || undefined,
                    classId: formData.classId || undefined
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to register student');
            }

            showToast('Student registered and assigned successfully.', 'success');
            router.push(`/${orgSlug}/dashboard/students`);
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Failed to register student', 'error');
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 w-full">
            <div className="mb-8">
                <BackButton />
                <div className="mt-8 flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
                        <UserPlus className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">Admit Student</h1>
                        <p className="text-indigo-100 font-bold opacity-80 mt-1">REGISTER NEW LEARNER ACCOUNT</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 p-10">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Account Info Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="col-span-1 md:col-span-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Full Name *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 bg-gray-50/50 text-gray-900"
                                        placeholder="Alex Johnson"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Email Address *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 bg-gray-50/50 text-gray-900"
                                        placeholder="student@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Temporary Password *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 bg-gray-50/50 text-gray-900"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Contact Number</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 bg-gray-50/50 text-gray-900"
                                        placeholder="+1 555-0123"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Academic Profile Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 mt-8">Academic Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Major / Course of Study</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <GraduationCap className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="major"
                                        value={formData.major}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 bg-gray-50/50 text-gray-900"
                                        placeholder="Intermediate Computer Science"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Registration #</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Hash className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="registrationNumber"
                                        value={formData.registrationNumber}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 bg-gray-50/50 text-gray-900"
                                        placeholder="CS-2026-001"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Class Selection Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 mt-8">Class Association</h3>
                        <p className="text-sm text-gray-500 mb-4 pl-1">Select the class/grade this student is enrolling in. They will automatically be associated with all courses in this class.</p>

                        <div className="relative group max-w-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <select
                                name="classId"
                                value={formData.classId}
                                onChange={handleChange}
                                className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 bg-white shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="" className="text-gray-500" disabled>Select Class/Grade</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id} className="text-gray-900">
                                        {cls.name} {cls.grade ? `(${cls.grade})` : ''} - {cls.courses?.length || 0} courses
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Personal & Billing Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 mt-8">Personal & Billing Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Father's Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="fatherName"
                                        value={formData.fatherName}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 bg-gray-50/50 text-gray-900"
                                        placeholder="Thomas Johnson"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Age</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 bg-gray-50/50 text-gray-900"
                                        placeholder="16"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Fee Plan (Monthly)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="number"
                                        name="fee"
                                        value={formData.fee}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 bg-gray-50/50 text-gray-900"
                                        placeholder="200"
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 pl-1">Home Address</label>
                                <div className="relative group">
                                    <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 bg-gray-50/50 text-gray-900 min-h-[100px]"
                                        placeholder="123 Education Lane, Learning City"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="pt-8 mt-8 border-t border-gray-100 flex justify-end gap-3">
                        <Link
                            href={`/${orgSlug}/dashboard/students`}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {isSaving && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            Admit Student
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
