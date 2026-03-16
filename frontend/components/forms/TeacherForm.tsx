'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, BookOpen, DollarSign, Phone, Plus, ShieldCheck, UserX, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Section, Teacher, TeacherStatus, Role } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomMultiSelect } from '@/components/ui/CustomMultiSelect';
import { PhotoUploadPicker } from '@/components/ui/PhotoUploadPicker';
import { getPublicUrl } from '@/lib/utils';

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
    const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

    // Initialize form state from initialData if provided (edit mode)
    const [formData, setFormData] = useState(() => {
        if (initialData) {
            return {
                name: initialData.user?.name || '',
                phone: initialData.user?.phone || '',
                email: initialData.user?.email || '',
                avatarUrl: initialData.user?.avatarUrl || null,
                password: '',
                education: initialData.education || '',
                designation: initialData.designation || '',
                subject: initialData.subject || '',
                salary: initialData.salary?.toString() || '',
                isManager: initialData.user?.role === Role.ORG_MANAGER,
                department: initialData.department || '',
                joiningDate: initialData.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                address: initialData.address || '',
                emergencyContact: initialData.emergencyContact || '',
                bloodGroup: initialData.bloodGroup || '',
                status: initialData.status || TeacherStatus.ACTIVE,
                sectionIds: initialData.sections?.map(s => s.id) || []
            };
        }
        return {
            name: '',
            phone: '',
            email: '',
            avatarUrl: null as string | null,
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
            status: TeacherStatus.ACTIVE,
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
            const response = await api.org.getSections(token!);
            setSections(response.data || []);
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
            const { password, avatarUrl, ...rest } = formData;
            const payload = {
                ...rest,
                salary: formData.salary ? Number(formData.salary) : null,
                isManager: formData.isManager,
                ...(teacherId ? (password ? { password } : {}) : { password })
            };

            let savedTeacher: Teacher;
            if (teacherId) {
                savedTeacher = await api.org.updateTeacher(teacherId, payload, token!);
            } else {
                savedTeacher = await api.org.createTeacher(payload, token!);
            }

            // Handle Photo Upload if pending
            if (pendingPhoto && savedTeacher.userId) {
                try {
                    await api.org.uploadAvatar(savedTeacher.userId, pendingPhoto, token!);
                } catch (uploadError) {
                    console.error('Avatar upload failed', uploadError);
                    showToast('Teacher created, but photo upload failed', 'info');
                }
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
        <form onSubmit={handleSubmit} className="space-y-12">
            {/* Mandatory Information */}
            <div className="bg-primary/5 p-6 rounded-sm border border-white/10">
                <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                    <PhotoUploadPicker
                        currentImageUrl={getPublicUrl(formData.avatarUrl)}
                        onFileReady={(file) => setPendingPhoto(file)}
                        hint="Teacher Profile Picture"
                    />
                    <div className="flex-1">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-card-text flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                Mandatory Information
                            </h3>
                            <p className="text-card-text/60 text-sm mt-1">These fields are required for administrative setup and account creation.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Label>Full Name *</Label>
                                <Input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required={!teacherId}
                                    icon={User}
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>
                        <Label>Email Address *</Label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required={!teacherId}
                            disabled={!!teacherId}
                            icon={Mail}
                            placeholder="john.doe@example.com"
                            className={teacherId ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {teacherId && <p className="text-[10px] text-primary/60 mt-1 font-bold italic uppercase">Email cannot be changed after creation</p>}
                    </div>

                    <div>
                        <Label>{teacherId ? 'Update Password (Optional)' : 'Initial Password *'}</Label>
                        <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={!teacherId}
                            minLength={8}
                            icon={Lock}
                            autoComplete="new-password"
                            placeholder={teacherId ? "Leave blank to keep current" : "Min 8 chars, 1 upper, 1 lower, 1 num"}
                        />
                    </div>

                    <div>
                        <Label>Joining Date *</Label>
                        <Input
                            type="date"
                            name="joiningDate"
                            value={formData.joiningDate}
                            onChange={handleChange}
                            required={!teacherId}
                        />
                    </div>

                    <div>
                        <Label>Status *</Label>
                        <CustomSelect
                            options={[
                                { value: TeacherStatus.ACTIVE, label: 'Active', icon: ShieldCheck },
                                { value: TeacherStatus.SUSPENDED, label: 'Suspended', icon: UserX },
                                { value: TeacherStatus.ON_LEAVE, label: 'On Leave', icon: CalendarClock }
                            ]}
                            value={formData.status}
                            onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                            placeholder="Select Status"
                            icon={
                                formData.status === TeacherStatus.ACTIVE ? ShieldCheck :
                                    formData.status === TeacherStatus.SUSPENDED ? UserX :
                                        CalendarClock
                            }
                        />
                    </div>

                    <div className="md:col-span-2 mt-4 p-6 bg-primary/5 border border-white/10 rounded-sm flex items-start space-x-6">
                        <div className="flex items-center h-8">
                            <input
                                id="isManager"
                                name="isManager"
                                type="checkbox"
                                checked={formData.isManager}
                                onChange={handleChange}
                                disabled={user?.role === Role.ORG_MANAGER}
                                className="w-6 h-6 text-primary border-white/20 rounded-sm focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-primary/5"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="isManager" className={`text-lg font-bold text-card-text ${user?.role === Role.ORG_MANAGER ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                Make Org-Manager
                            </label>
                            <p className="text-card-text/60 font-medium text-sm mt-1">
                                Org-Managers have full access to organization settings and can manage other teachers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Optional / Profile Details */}
            <div className="p-6 rounded-sm border border-white/5 bg-white/2">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-card-text flex items-center gap-2">
                        <User className="w-6 h-6 text-card-text/60" />
                        Optional Profile Details
                    </h3>
                    <p className="text-card-text/60 text-sm mt-1">These fields can be filled now or updated by the teacher later from their profile.</p>
                </div>

                <div className="space-y-8">
                    {/* Academic Details */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary/60 mb-4 border-b border-white/5 pb-1">Specialization & Department</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="md:col-span-2">
                                <Label>Section Assignment</Label>
                                <CustomMultiSelect
                                    options={sectionOptions}
                                    values={formData.sectionIds}
                                    onChange={(vals) => setFormData(prev => ({ ...prev, sectionIds: vals }))}
                                    icon={BookOpen}
                                    placeholder="Select Sections"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Details */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary/60 mb-4 border-b border-white/5 pb-1">Professional Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        </div>
                    </div>

                    {/* Contact & Personal */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary/60 mb-4 border-b border-white/5 pb-1">Contact & Personal</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <div className="md:col-span-3">
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
                        </div>
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
