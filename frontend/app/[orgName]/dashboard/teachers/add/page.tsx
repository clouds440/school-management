'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { UserPlus, User, Mail, Lock, BookOpen, DollarSign, Phone, Plus } from 'lucide-react';
import Link from 'next/link';
import { Section } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

export default function AddTeacherPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();
    const orgSlug = user?.orgSlug || pathname.split('/')[1];

    useEffect(() => {
        if (user && user.role !== 'ORG_ADMIN' && user.role !== 'ORG_MANAGER') {
            router.replace(`/${orgSlug}/dashboard`);
        }
    }, [user, router, orgSlug]);

    const [sections, setSections] = useState<Section[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        education: '',
        designation: '',
        subject: '',
        salary: '',
        isManager: false,
        department: '',
        joiningDate: new Date().toISOString().split('T')[0],
        address: '',
        emergencyContact: '',
        bloodGroup: '',
        status: 'ACTIVE',
        sectionIds: [] as string[]
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSectionsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, sectionIds: selected }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await fetch('http://localhost:3000/org/teachers', {
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
                    education: formData.education || undefined,
                    designation: formData.designation || undefined,
                    subject: formData.subject || undefined,
                    salary: formData.salary ? Number(formData.salary) : undefined,
                    isManager: formData.isManager,
                    department: formData.department || undefined,
                    joiningDate: formData.joiningDate || undefined,
                    address: formData.address || undefined,
                    emergencyContact: formData.emergencyContact || undefined,
                    bloodGroup: formData.bloodGroup || undefined,
                    status: formData.status,
                    sectionIds: formData.sectionIds.length > 0 ? formData.sectionIds : undefined
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to create teacher');
            }

            showToast('Teacher account created successfully', 'success');
            router.push(`/${orgSlug}/dashboard/teachers`);
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Failed to create teacher', 'error');
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="mb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 shadow-xl">
                        <UserPlus className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">Add Teacher</h1>
                        <p className="text-indigo-100 font-bold opacity-80 mt-1">CREATE NEW FACULTY ACCOUNT</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-sm shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-white/50 p-12">

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <Label>Full Name</Label>
                            <Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                icon={User}
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                icon={Mail}
                                placeholder="john.doe@example.com"
                            />
                        </div>

                        <div>
                            <Label>Initial Password</Label>
                            <Input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={8}
                                icon={Lock}
                                placeholder="Min 8 characters"
                            />
                        </div>

                        <div>
                            <Label>Department</Label>
                            <Input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                icon={BookOpen}
                                placeholder="Science / Arts / Engineering"
                            />
                        </div>

                        <div>
                            <Label>Joining Date</Label>
                            <Input
                                type="date"
                                name="joiningDate"
                                value={formData.joiningDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <Label>Phone Number</Label>
                            <Input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                icon={Phone}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div>
                            <Label>Education</Label>
                            <Input
                                type="text"
                                name="education"
                                value={formData.education}
                                onChange={handleChange}
                                icon={BookOpen}
                                placeholder="M.S. Computer Science"
                            />
                        </div>

                        <div>
                            <Label>Designation</Label>
                            <Input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                icon={User}
                                placeholder="Senior Teacher"
                            />
                        </div>

                        <div>
                            <Label>Subject Specialization</Label>
                            <Input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                icon={BookOpen}
                                placeholder="E.g., Mathematics"
                            />
                        </div>

                        <div>
                            <Label>Base Salary</Label>
                            <Input
                                type="number"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                icon={DollarSign}
                                placeholder="50000"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label>Residential Address</Label>
                            <Input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                icon={User}
                                placeholder="123 Main St, City, Country"
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
                                placeholder="Name - Relationship - Phone"
                            />
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
                            <Label>Status</Label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange as any}
                                className="w-full px-4 py-3 mt-1 rounded-sm border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="SUSPENDED">Suspended</option>
                                <option value="ON_LEAVE">On Leave</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 mt-4">Section Assignment</h3>
                            <p className="text-sm text-gray-500 mb-4 pl-1">Select the sections this teacher is assigned to teach. Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</p>

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

                        <div className="md:col-span-2 mt-4 p-8 bg-indigo-50/50 border border-indigo-100/50 rounded-sm flex items-start space-x-6">
                            <div className="flex items-center h-8">
                                <input
                                    id="isManager"
                                    name="isManager"
                                    type="checkbox"
                                    checked={formData.isManager}
                                    onChange={handleChange}
                                    disabled={user?.role === 'ORG_MANAGER'}
                                    className="w-6 h-6 text-indigo-600 border-gray-300 rounded-sm focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="isManager" className={`text-lg font-bold text-gray-900 ${user?.role === 'ORG_MANAGER' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    Make Org-Manager
                                </label>
                                <p className={`text-gray-500 font-medium mt-1 ${user?.role === 'ORG_MANAGER' ? 'opacity-50' : ''}`}>
                                    Org-Managers have full access to organization settings and can manage other teachers.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 mt-10 border-t border-gray-100 flex justify-end gap-5">
                        <Link
                            href={`/${orgSlug}/dashboard/teachers`}
                            className="px-8 py-3 text-base font-bold text-gray-600 bg-gray-100 rounded-sm hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 flex items-center shadow-lg border border-transparent"
                        >
                            Cancel
                        </Link>
                        <Button
                            type="submit"
                            isLoading={isSaving}
                            loadingText="Creating..."
                            className="px-10"
                        >
                            Create Teacher Account
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
