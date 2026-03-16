'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Phone, MapPin, Hash, BookOpen, GraduationCap, DollarSign, Plus, Users, ShieldCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomMultiSelect } from '@/components/ui/CustomMultiSelect';
import { api } from '@/lib/api';
import { Section, Student, StudentStatus } from '@/types';

import { PhotoUploadPicker } from '@/components/ui/PhotoUploadPicker';
import { getPublicUrl } from '@/lib/utils';

interface StudentFormProps {
    studentId?: string;
    orgSlug: string;
    initialData?: Student; // Pre-fetched student data for edit mode
}

export default function StudentForm({ studentId, orgSlug, initialData }: StudentFormProps) {
    const { token } = useAuth();
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
                email: initialData.user?.email || '',
                avatarUrl: initialData.user?.avatarUrl || null,
                password: '',
                phone: initialData.user?.phone || '',
                registrationNumber: initialData.registrationNumber || '',
                fatherName: initialData.fatherName || '',
                fee: initialData.fee?.toString() || '',
                age: initialData.age?.toString() || '',
                address: initialData.address || '',
                major: initialData.major || '',
                sectionIds: initialData.enrollments?.map(e => e.section?.id).filter(Boolean) as string[] || [],
                department: initialData.department || '',
                admissionDate: initialData.admissionDate ? new Date(initialData.admissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                graduationDate: initialData.graduationDate ? new Date(initialData.graduationDate).toISOString().split('T')[0] : '',
                gender: initialData.gender || '',
                bloodGroup: initialData.bloodGroup || '',
                emergencyContact: initialData.emergencyContact || '',
                feePlan: initialData.feePlan || '',
                status: initialData.status || StudentStatus.ACTIVE
            };
        }
        return {
            name: '',
            email: '',
            avatarUrl: null as string | null,
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
            status: StudentStatus.ACTIVE
        };
    });

    // Fetch sections for the dropdown — always needed
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const { password, avatarUrl, ...rest } = formData;
            const payload = {
                ...rest,
                fee: formData.fee ? Number(formData.fee) : null,
                age: formData.age ? Number(formData.age) : null,
                ...(studentId ? (password ? { password } : {}) : { password })
            };

            let savedStudent: Student;
            if (studentId) {
                savedStudent = await api.org.updateStudent(studentId, payload, token!);
            } else {
                savedStudent = await api.org.createStudent(payload, token!);
            }

            // Handle Photo Upload if pending
            if (pendingPhoto && savedStudent.userId) {
                try {
                    await api.org.uploadAvatar(savedStudent.userId, pendingPhoto, token!);
                } catch (uploadError) {
                    console.error('Avatar upload failed', uploadError);
                    showToast('Student registered, but photo upload failed', 'info');
                }
            }

            showToast(`Student ${studentId ? 'updated' : 'registered'} successfully.`, 'success');
            router.push(`/${orgSlug}/dashboard/students`);
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
                        hint="Student Profile Picture"
                    />
                    <div className="flex-1">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-card-text flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                Mandatory Information
                            </h3>
                            <p className="text-card-text/60 text-sm mt-1">These fields are required for administrative setup and account creation.</p>
                        </div>

                        <div className="col-span-1 md:col-span-3">
                            <Label>Full Name *</Label>
                            <Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required={!studentId}
                                icon={User}
                                placeholder="Alex Johnson"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div>
                        <Label>Email Address *</Label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required={!studentId}
                            disabled={!!studentId}
                            icon={Mail}
                            placeholder="student@example.com"
                            className={studentId ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {studentId && <p className="text-[10px] text-primary/60 mt-1 font-bold italic uppercase">Email cannot be changed after registration</p>}
                    </div>

                    <div>
                        <Label>{studentId ? 'Update Password (Optional)' : 'Temporary Password *'}</Label>
                        <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={!studentId}
                            minLength={8}
                            icon={Lock}
                            autoComplete="new-password"
                            placeholder={studentId ? "Leave blank to keep current" : "Min 8 chars, 1 upper, 1 lower, 1 num"}
                        />
                    </div>

                    <div>
                        <Label>Registration # *</Label>
                        <Input
                            type="text"
                            name="registrationNumber"
                            value={formData.registrationNumber}
                            onChange={handleChange}
                            required
                            disabled={!!studentId}
                            icon={Hash}
                            placeholder="CS-2026-001"
                            className={studentId ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {studentId && <p className="text-[10px] text-primary/60 mt-1 font-bold italic uppercase">Registration # is fixed</p>}
                    </div>

                    <div>
                        <Label>Admission Date *</Label>
                        <Input
                            type="date"
                            name="admissionDate"
                            value={formData.admissionDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <Label>Status *</Label>
                        <CustomSelect
                            options={[
                                { value: StudentStatus.ACTIVE, label: 'Active', icon: ShieldCheck },
                                { value: StudentStatus.SUSPENDED, label: 'Suspended', icon: UserX },
                                { value: StudentStatus.ALUMNI, label: 'Alumni', icon: GraduationCap }
                            ]}
                            value={formData.status}
                            onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                            placeholder="Select Status"
                            icon={
                                formData.status === StudentStatus.ACTIVE ? ShieldCheck :
                                    formData.status === StudentStatus.SUSPENDED ? UserX :
                                        GraduationCap
                            }
                        />
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
                    <p className="text-card-text/60 text-sm mt-1">These fields can be filled now or updated by the student later from their profile.</p>
                </div>

                <div className="space-y-8">
                    {/* Academic Details */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary/60 mb-4 border-b border-white/5 pb-1">Academic & Department</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
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
                            <div>
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
                            <div className="md:col-span-2">
                                <Label>Section Assignment</Label>
                                <CustomMultiSelect
                                    options={sectionOptions}
                                    values={formData.sectionIds}
                                    onChange={(vals) => setFormData(prev => ({ ...prev, sectionIds: vals }))}
                                    icon={Users}
                                    placeholder="Select Sections"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Personal & Billing */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary/60 mb-4 border-b border-white/5 pb-1">Personal & Billing</h4>
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
                                <Label>Gender</Label>
                                <CustomSelect
                                    options={[
                                        { value: 'Male', label: 'Male' },
                                        { value: 'Female', label: 'Female' },
                                        { value: 'Other', label: 'Other' }
                                    ]}
                                    value={formData.gender}
                                    onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                                    icon={Users}
                                    placeholder="Select Gender"
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

                    {/* Contact & Medical */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary/60 mb-4 border-b border-white/5 pb-1">Contact & Medical</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                <Label>Home Address</Label>
                                <div className="relative group">
                                    <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-card-text/40 group-focus-within:text-primary transition-colors">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 rounded-sm border border-white/10 bg-primary/5 text-card-text placeholder:text-card-text/40 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm transition-all duration-200 shadow-sm min-h-[100px] outline-none font-bold"
                                        placeholder="123 Education Lane, Learning City"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 mt-8 border-t border-white/10 flex justify-end gap-5">
                <Link
                    href={`/${orgSlug}/dashboard/students`}
                    className="px-8 py-3 text-base font-bold text-secondary-text bg-secondary rounded-sm hover:brightness-110 transition-all hover:scale-105 active:scale-95 flex items-center shadow-lg border border-transparent"
                >
                    Cancel
                </Link>
                <Button
                    type="submit"
                    isLoading={isSaving}
                    loadingText={studentId ? "Updating..." : "Admitting..."}
                    className="px-10"
                >
                    {studentId ? 'Update Student Record' : 'Admit Student'}
                </Button>
            </div>
        </form>
    );
}
