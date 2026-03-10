'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { UserPlus, User, Mail, Lock, Phone, MapPin, Hash, BookOpen, GraduationCap, DollarSign, Plus, Users, ShieldCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Section } from '@/types';

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

    const [sections, setSections] = useState<Section[]>([]);
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
        sectionIds: [] as string[],
        department: '',
        admissionDate: new Date().toISOString().split('T')[0],
        graduationDate: '',
        gender: '',
        bloodGroup: '',
        emergencyContact: '',
        feePlan: '',
        status: 'ACTIVE'
    });

    useEffect(() => {
        if (token) fetchSections();
    }, [token]);

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
            console.error('Failed to fetch sections', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // For multi-select
    const handleSectionsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, sectionIds: selected }));
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
                    sectionIds: formData.sectionIds.length > 0 ? formData.sectionIds : undefined,
                    department: formData.department || undefined,
                    admissionDate: formData.admissionDate || undefined,
                    graduationDate: formData.graduationDate || undefined,
                    gender: formData.gender || undefined,
                    bloodGroup: formData.bloodGroup || undefined,
                    emergencyContact: formData.emergencyContact || undefined,
                    feePlan: formData.feePlan || undefined,
                    status: formData.status
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
        <>
            <div className="mb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl shrink-0">
                        <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">Admit Student</h1>
                        <p className="text-indigo-100 font-bold opacity-80 mt-1 text-sm md:text-base">REGISTER NEW LEARNER ACCOUNT</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/50 p-6 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Account Info Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="col-span-1 md:col-span-3">
                                <Label>Full Name *</Label>
                                <Input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    icon={User}
                                    placeholder="Alex Johnson"
                                />
                            </div>

                            <div>
                                <Label>Email Address *</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    icon={Mail}
                                    placeholder="student@example.com"
                                />
                            </div>

                            <div>
                                <Label>Temporary Password *</Label>
                                <Input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    icon={Lock}
                                    placeholder="Min 8 characters (1 upper, 1 lower, 1 number)"
                                />
                            </div>

                            <div>
                                <Label>Contact Number</Label>
                                <Input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    icon={Phone}
                                    placeholder="+1 555-0123"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Academic Profile Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 mt-8">Academic Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="col-span-2">
                                <Label>Major / Course of Study</Label>
                                <Input
                                    type="text"
                                    name="major"
                                    value={formData.major}
                                    onChange={handleChange}
                                    icon={GraduationCap}
                                    placeholder="Intermediate Computer Science"
                                />
                            </div>

                            <div className="col-span-2">
                                <Label>Registration #</Label>
                                <Input
                                    type="text"
                                    name="registrationNumber"
                                    value={formData.registrationNumber}
                                    onChange={handleChange}
                                    icon={Hash}
                                    placeholder="CS-2026-001"
                                />
                            </div>

                            <div className="col-span-2">
                                <Label>Department</Label>
                                <Input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    icon={BookOpen}
                                    placeholder="Science / Humanities / Arts"
                                />
                            </div>

                            <div>
                                <Label>Admission Date</Label>
                                <Input
                                    type="date"
                                    name="admissionDate"
                                    value={formData.admissionDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Expected Graduation</Label>
                                <Input
                                    type="date"
                                    name="graduationDate"
                                    value={formData.graduationDate}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Assignment */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 mt-8">Section Assignment</h3>
                        <p className="text-sm text-gray-500 mb-4 pl-1">Select the sections this student is enrolling in. Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</p>

                        <div className="max-w-xl">
                            <select
                                multiple
                                name="sectionIds"
                                value={formData.sectionIds}
                                onChange={handleSectionsChange}
                                className="w-full px-4 py-3 rounded-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white min-h-[120px]"
                            >
                                {sections.map(sec => (
                                    <option key={sec.id} value={sec.id} className="text-gray-900 py-1">
                                        {sec.name} {sec.course?.name ? `(${sec.course.name})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Personal & Billing Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 mt-8">Personal & Billing Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            <div>
                                <Label>Father's Name</Label>
                                <Input
                                    type="text"
                                    name="fatherName"
                                    value={formData.fatherName}
                                    onChange={handleChange}
                                    icon={User}
                                    placeholder="Thomas Johnson"
                                />
                            </div>

                            <div>
                                <Label>Age</Label>
                                <Input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    icon={User}
                                    placeholder="16"
                                />
                            </div>

                            <div>
                                <Label>Monthly Fee</Label>
                                <Input
                                    type="number"
                                    name="fee"
                                    value={formData.fee}
                                    onChange={handleChange}
                                    icon={DollarSign}
                                    placeholder="200"
                                />
                            </div>

                            <div>
                                <Label>Fee Plan Type</Label>
                                <Input
                                    type="text"
                                    name="feePlan"
                                    value={formData.feePlan}
                                    onChange={handleChange}
                                    icon={BookOpen}
                                    placeholder="Standard / Scholarship / etc."
                                />
                            </div>

                            <div>
                                <Label>Gender</Label>
                                <Select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    icon={Users}
                                >
                                    <option value="" className="text-gray-900 font-bold">Select Gender</option>
                                    <option value="Male" className="text-gray-900 font-bold">Male</option>
                                    <option value="Female" className="text-gray-900 font-bold">Female</option>
                                    <option value="Other" className="text-gray-900 font-bold">Other</option>
                                </Select>
                            </div>

                            <div>
                                <Label>Blood Group</Label>
                                <Input
                                    type="text"
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                    icon={Plus}
                                    placeholder="O+, A-, etc."
                                />
                            </div>

                            <div>
                                <Label>Emergency Contact</Label>
                                <Input
                                    type="text"
                                    name="emergencyContact"
                                    value={formData.emergencyContact}
                                    onChange={handleChange}
                                    icon={Phone}
                                    placeholder="Name - Relation - Phone"
                                />
                            </div>

                            <div>
                                <Label>Status</Label>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange as any}
                                    icon={
                                        formData.status === 'ACTIVE' ? ShieldCheck :
                                            formData.status === 'SUSPENDED' ? UserX :
                                                GraduationCap
                                    }
                                >
                                    <option value="ACTIVE" className="text-gray-900 font-bold">Active</option>
                                    <option value="SUSPENDED" className="text-gray-900 font-bold">Suspended</option>
                                    <option value="ALUMNI" className="text-gray-900 font-bold">Alumni</option>
                                </Select>
                            </div>

                            <div className="col-span-1 md:col-span-3">
                                <Label>Home Address</Label>
                                <div className="relative group">
                                    <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 rounded-sm border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm min-h-[100px]"
                                        placeholder="123 Education Lane, Learning City"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="pt-8 mt-8 border-t border-gray-100 flex justify-end gap-5">
                        <Link
                            href={`/${orgSlug}/dashboard/students`}
                            className="px-8 py-3 text-base font-bold text-gray-600 bg-gray-100 rounded-sm hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 flex items-center shadow-lg border border-transparent"
                        >
                            Cancel
                        </Link>
                        <Button
                            type="submit"
                            isLoading={isSaving}
                            loadingText="Admitting..."
                            className="px-10"
                        >
                            Admit Student
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
