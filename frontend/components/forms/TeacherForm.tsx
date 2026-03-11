'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, BookOpen, DollarSign, Phone, Plus, ShieldCheck, UserX, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { Section, Teacher } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomMultiSelect } from '@/components/ui/CustomMultiSelect';

interface TeacherFormProps {
    teacherId?: string;
    orgSlug: string;
    initialData?: Teacher; // Pre-fetched teacher data for edit mode
}

export default function TeacherForm({ teacherId, orgSlug, initialData }: TeacherFormProps) {
    const { token, user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);

    // Initialize form state from initialData if provided (edit mode)
    const [formData, setFormData] = useState(() => {
        if (initialData) {
            return {
                name: initialData.user?.name || '',
                phone: initialData.user?.phone || '',
                email: initialData.user?.email || '',
                password: '',
                education: initialData.education || '',
                designation: initialData.designation || '',
                subject: initialData.subject || '',
                salary: initialData.salary?.toString() || '',
                isManager: initialData.user?.role === 'ORG_MANAGER',
                department: initialData.department || '',
                joiningDate: initialData.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                address: initialData.address || '',
                emergencyContact: initialData.emergencyContact || '',
                bloodGroup: initialData.bloodGroup || '',
                status: initialData.status || 'ACTIVE',
                sectionIds: initialData.sections?.map(s => s.id) || []
            };
        }
        return {
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
        };
    });

    // Fetch sections for the dropdown — this is always needed
    useEffect(() => {
        if (token) {
            fetchSections();
        }
    }, [token]);

    const fetchSections = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/org/sections`, {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = teacherId 
                ? `${process.env.NEXT_PUBLIC_API_URL}/org/teachers/${teacherId}` 
                : `${process.env.NEXT_PUBLIC_API_URL}/org/teachers`;
            
            const method = teacherId ? 'PATCH' : 'POST';

            const payload: any = {
                name: formData.name,
                email: formData.email,
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
            };

            if (!teacherId || formData.password) {
                payload.password = formData.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `Failed to ${teacherId ? 'update' : 'create'} teacher`);
            }

            showToast(`Teacher account ${teacherId ? 'updated' : 'created'} successfully`, 'success');
            router.push(`/${orgSlug}/dashboard/teachers`);
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Action failed', 'error');
            setIsSaving(false);
        }
    };

    const sectionOptions = sections.map(sec => ({
        value: sec.id,
        label: `${sec.name} ${sec.course?.name ? `(${sec.course.name})` : ''}`
    }));

    return (
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
                    <Label>{teacherId ? 'Update Password (Optional)' : 'Initial Password'}</Label>
                    <Input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!teacherId}
                        minLength={8}
                        icon={Lock}
                        placeholder={teacherId ? "Leave blank to keep current" : "Min 8 characters"}
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
                    <CustomSelect
                        options={[
                            { value: 'ACTIVE', label: 'Active', icon: ShieldCheck },
                            { value: 'SUSPENDED', label: 'Suspended', icon: UserX },
                            { value: 'ON_LEAVE', label: 'On Leave', icon: CalendarClock }
                        ]}
                        value={formData.status}
                        onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                        placeholder="Select Status"
                        icon={
                            formData.status === 'ACTIVE' ? ShieldCheck :
                                formData.status === 'SUSPENDED' ? UserX :
                                    CalendarClock
                        }
                    />
                </div>

                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-card-text border-b border-white/10 pb-2 mb-2 mt-4">Section Assignment</h3>
                    <p className="text-sm text-card-text/60 mb-2 pl-1 text-[11px] uppercase tracking-widest font-bold">Select the sections this teacher is assigned to teach</p>

                    <div className="max-w-xl">
                        <CustomMultiSelect
                            options={sectionOptions}
                            values={formData.sectionIds}
                            onChange={(vals) => setFormData(prev => ({ ...prev, sectionIds: vals }))}
                            icon={BookOpen}
                            placeholder="Select Sections"
                        />
                    </div>
                </div>

                <div className="md:col-span-2 mt-4 p-8 bg-primary/5 border border-white/10 rounded-sm flex items-start space-x-6">
                    <div className="flex items-center h-8">
                        <input
                            id="isManager"
                            name="isManager"
                            type="checkbox"
                            checked={formData.isManager}
                            onChange={handleChange}
                            disabled={user?.role === 'ORG_MANAGER'}
                            className="w-6 h-6 text-primary border-white/20 rounded-sm focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-primary/5"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="isManager" className={`text-lg font-bold text-card-text ${user?.role === 'ORG_MANAGER' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            Make Org-Manager
                        </label>
                        <p className={`text-card-text/60 font-medium mt-1 ${user?.role === 'ORG_MANAGER' ? 'opacity-50' : ''}`}>
                            Org-Managers have full access to organization settings and can manage other teachers.
                        </p>
                    </div>
                </div>
            </div>

            <div className="pt-10 mt-10 border-t border-white/10 flex justify-end gap-5">
                <Link
                    href={`/${orgSlug}/dashboard/teachers`}
                    className="px-8 py-3 text-base font-bold text-secondary-text bg-secondary rounded-sm hover:brightness-110 transition-all hover:scale-105 active:scale-95 flex items-center shadow-lg border border-transparent"
                >
                    Cancel
                </Link>
                <Button
                    type="submit"
                    isLoading={isSaving}
                    loadingText={teacherId ? "Updating..." : "Creating..."}
                    className="px-10"
                >
                    {teacherId ? 'Update Teacher Account' : 'Create Teacher Account'}
                </Button>
            </div>
        </form>
    );
}
