'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Hash, Calendar, ShieldCheck, UserX, GraduationCap, BookOpen, MapPin, Phone, Plus, Users, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import { Section, Student, StudentStatus, CreateStudentRequest, UpdateStudentRequest } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomMultiSelect } from '@/components/ui/CustomMultiSelect';
import { PhotoUploadPicker } from '@/components/ui/PhotoUploadPicker';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentCreateSchema, studentUpdateSchema, StudentCreateFormData, StudentUpdateFormData } from '@/lib/schemas';

interface StudentFormProps {
    studentId?: string;
    orgSlug: string;
    initialData?: Student;
}

export default function StudentForm({ studentId, orgSlug, initialData }: StudentFormProps) {
    const { token } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [sections, setSections] = useState<Section[]>([]);
    const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(studentId ? studentUpdateSchema : studentCreateSchema),
        defaultValues: initialData ? {
            name: initialData.user?.name || '',
            email: initialData.user?.email || '',
            password: '',
            registrationNumber: initialData.registrationNumber || '',
            admissionDate: initialData.admissionDate ? new Date(initialData.admissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: initialData.status as StudentStatus || StudentStatus.ACTIVE,
            sectionIds: initialData.enrollments?.map(e => e.section.id) || [],
            major: initialData.major || '',
            department: initialData.department || '',
            fatherName: initialData.fatherName || '',
            age: initialData.age?.toString() || '',
            gender: initialData.gender || '',
            fee: initialData.fee?.toString() || '',
            feePlan: initialData.feePlan || '',
            graduationDate: initialData.graduationDate ? new Date(initialData.graduationDate).toISOString().split('T')[0] : '',
            phone: initialData.user?.phone || '',
            emergencyContact: initialData.emergencyContact || '',
            bloodGroup: initialData.bloodGroup || '',
            address: initialData.address || ''
        } : {
            name: '',
            email: '',
            password: '',
            registrationNumber: '',
            admissionDate: new Date().toISOString().split('T')[0],
            status: StudentStatus.ACTIVE,
            sectionIds: [],
            major: '',
            department: '',
            fatherName: '',
            age: '',
            gender: '',
            fee: '',
            feePlan: '',
            graduationDate: '',
            phone: '',
            emergencyContact: '',
            bloodGroup: '',
            address: ''
        }
    });

    const formData = watch();

    const onSubmit: SubmitHandler<StudentCreateFormData | StudentUpdateFormData> = async (data) => {
        setIsSaving(true);
        try {
            const { password, fee, age, ...rest } = data;
            const payload: CreateStudentRequest | UpdateStudentRequest = {
                ...rest,
                fee: fee ? Number(fee) : null,
                age: age ? Number(age) : null,
                ...(studentId ? (password ? { password } : {}) : { password })
            };

            let savedStudent: Student;
            if (studentId) {
                savedStudent = await api.org.updateStudent(studentId, payload as UpdateStudentRequest, token!);
            } else {
                savedStudent = await api.org.createStudent(payload as CreateStudentRequest, token!);
            }

            if (pendingPhoto && savedStudent.userId) {
                try {
                    await api.org.uploadAvatar(savedStudent.userId, pendingPhoto, token!);
                } catch {
                    showToast('Student registered, but photo upload failed', 'info');
                }
            }

            showToast(`Student ${studentId ? 'updated' : 'registered'} successfully.`, 'success');
            router.push(`/${orgSlug}/dashboard/students`);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string | string[] } } };
            const message = err.response?.data?.message;
            if (Array.isArray(message)) {
                message.forEach((m: string) => showToast(m, 'error'));
            } else {
                showToast(message || 'Failed to save student', 'error');
            }
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (token) {
            api.org.getSections(token).then(res => setSections(res.data || [])).catch(console.error);
        }
    }, [token]);

    const handlePhotoReady = useCallback((file: File) => {
        setPendingPhoto(file);
    }, []);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12" noValidate>
            {/* Enrollment Details */}
            <div className="bg-primary/5 p-6 rounded-sm border border-white/10">
                <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                    <div className="shrink-0 group relative">
                        <PhotoUploadPicker
                            onFileReady={handlePhotoReady}
                            type="user"
                            currentImageUrl={initialData?.user?.avatarUrl}
                        />
                        <p className="mt-3 text-[10px] text-center font-black uppercase tracking-widest text-card-text/40 group-hover:text-primary transition-colors">
                            {studentId ? 'Update Photo' : 'Upload Photo'}
                        </p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                type="text"
                                {...register('name')}
                                error={!!errors.name}
                                icon={User}
                                placeholder="Alex Johnson"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500 font-bold">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Account Email</Label>
                            <Input
                                type="email"
                                {...register('email')}
                                error={!!errors.email}
                                disabled={!!studentId}
                                icon={Mail}
                                placeholder="alex.j@example.com"
                                className={studentId ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500 font-bold">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Login Password</Label>
                            <Input
                                type="password"
                                {...register('password')}
                                error={!!errors.password}
                                icon={Lock}
                                placeholder={studentId ? "Leave blank to keep current" : "Min 8 chars, 1 upper, 1 lower, 1 num"}
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-500 font-bold">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Registration Number</Label>
                            <Input
                                type="text"
                                {...register('registrationNumber')}
                                error={!!errors.registrationNumber}
                                disabled={!!studentId}
                                icon={Hash}
                                placeholder="ST-2026-001"
                            />
                            {errors.registrationNumber && <p className="mt-1 text-xs text-red-500 font-bold">{errors.registrationNumber.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Admission Date</Label>
                            <Input
                                type="date"
                                {...register('admissionDate')}
                                error={!!errors.admissionDate}
                            />
                            {errors.admissionDate && <p className="mt-1 text-xs text-red-500 font-bold">{errors.admissionDate.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Student Status</Label>
                            <CustomSelect
                                options={[
                                    { value: StudentStatus.ACTIVE, label: 'Active', icon: ShieldCheck },
                                    { value: StudentStatus.SUSPENDED, label: 'Suspended', icon: UserX },
                                    { value: StudentStatus.ALUMNI, label: 'Alumni', icon: GraduationCap }
                                ]}
                                value={formData.status}
                                onChange={(val) => {
                                    setValue('status', val as StudentStatus);
                                    trigger('status');
                                }}
                                error={!!errors.status}
                                icon={
                                    formData.status === StudentStatus.ACTIVE ? ShieldCheck :
                                        formData.status === StudentStatus.SUSPENDED ? UserX : GraduationCap
                                }
                            />
                            {errors.status && <p className="mt-1 text-xs text-red-500 font-bold">{errors.status.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Major / Program</Label>
                        <Input
                            type="text"
                            {...register('major')}
                            error={!!errors.major}
                            icon={GraduationCap}
                            placeholder="Computer Science"
                        />
                        {errors.major && <p className="mt-1 text-xs text-red-500 font-bold">{errors.major.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Input
                            type="text"
                            {...register('department')}
                            error={!!errors.department}
                            icon={BookOpen}
                            placeholder="Engineering & Tech"
                        />
                        {errors.department && <p className="mt-1 text-xs text-red-500 font-bold">{errors.department.message}</p>}
                    </div>
                </div>
            </div>

            {/* Academic Placement */}
            <div className="bg-card p-8 rounded-sm border border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-sm">
                        <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-card-text">Academic Placement</h3>
                </div>

                <div className="space-y-2 max-w-2xl">
                    <Label>Enroll in Sections</Label>
                    <CustomMultiSelect
                        options={sections.map(s => ({
                            value: s.id,
                            label: `${s.name} ${s.course?.name ? `(${s.course.name})` : ''}`
                        }))}
                        values={formData.sectionIds}
                        onChange={(vals) => {
                            setValue('sectionIds', vals);
                            trigger('sectionIds');
                        }}
                        placeholder="Select one or more sections..."
                        error={!!errors.sectionIds}
                    />
                    {errors.sectionIds && <p className="mt-1 text-xs text-red-500 font-bold">{errors.sectionIds.message}</p>}
                </div>
            </div>

            {/* Billing & Progress */}
            <div className="bg-card p-8 rounded-sm border border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-sm">
                        <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-card-text">Billing & Expected Progress</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <Label>Annual/Semester Fee</Label>
                        <Input
                            type="number"
                            {...register('fee')}
                            error={!!errors.fee}
                            icon={DollarSign}
                            placeholder="12000"
                        />
                        {errors.fee && <p className="mt-1 text-xs text-red-500 font-bold">{errors.fee.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Fee Plan</Label>
                        <Input
                            type="text"
                            {...register('feePlan')}
                            error={!!errors.feePlan}
                            icon={BookOpen}
                            placeholder="Standard / Installments"
                        />
                        {errors.feePlan && <p className="mt-1 text-xs text-red-500 font-bold">{errors.feePlan.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Exp. Graduation</Label>
                        <Input
                            type="date"
                            {...register('graduationDate')}
                            error={!!errors.graduationDate}
                        />
                        {errors.graduationDate && <p className="mt-1 text-xs text-red-500 font-bold">{errors.graduationDate.message}</p>}
                    </div>
                </div>
            </div>

            {/* Profile & Contact */}
            <div className="bg-card p-8 rounded-sm border border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-sm">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-card-text">Personal Profile</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div className="space-y-2">
                        <Label>Father / Guardian Name</Label>
                        <Input
                            type="text"
                            {...register('fatherName')}
                            error={!!errors.fatherName}
                            icon={User}
                            placeholder="Michael Johnson"
                        />
                        {errors.fatherName && <p className="mt-1 text-xs text-red-500 font-bold">{errors.fatherName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Current Age</Label>
                        <Input
                            type="number"
                            {...register('age')}
                            error={!!errors.age}
                            icon={User}
                            placeholder="16"
                        />
                        {errors.age && <p className="mt-1 text-xs text-red-500 font-bold">{errors.age.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Gender Identification</Label>
                        <CustomSelect
                            options={[
                                { value: 'Male', label: 'Male' },
                                { value: 'Female', label: 'Female' },
                                { value: 'Other', label: 'Other' }
                            ]}
                            value={formData.gender}
                            onChange={(val) => {
                                setValue('gender', val);
                                trigger('gender');
                            }}
                            error={!!errors.gender}
                            icon={Users}
                            placeholder="Gender"
                        />
                        {errors.gender && <p className="mt-1 text-xs text-red-500 font-bold">{errors.gender.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Contact Phone</Label>
                            <Input
                                type="text"
                                {...register('phone')}
                                error={!!errors.phone}
                                icon={Phone}
                                placeholder="+1 555-0100"
                            />
                            {errors.phone && <p className="mt-1 text-xs text-red-500 font-bold">{errors.phone.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Emergency Contact</Label>
                            <Input
                                type="text"
                                {...register('emergencyContact')}
                                error={!!errors.emergencyContact}
                                icon={Phone}
                                placeholder="Relationship - Phone"
                            />
                            {errors.emergencyContact && <p className="mt-1 text-xs text-red-500 font-bold">{errors.emergencyContact.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Blood Group</Label>
                            <Input
                                type="text"
                                {...register('bloodGroup')}
                                error={!!errors.bloodGroup}
                                icon={Plus}
                                placeholder="A+, B-, etc."
                            />
                            {errors.bloodGroup && <p className="mt-1 text-xs text-red-500 font-bold">{errors.bloodGroup.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Residential Address</Label>
                        <div className="relative group">
                            <div className={`absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none transition-colors ${errors.address ? 'text-red-500' : 'text-card-text/40 group-focus-within:text-primary'}`}>
                                <MapPin className="h-5 w-5" />
                            </div>
                            <textarea
                                {...register('address')}
                                className={`w-full pl-11 pr-4 py-3 rounded-sm border ${errors.address ? 'border-red-500 ring-4 ring-red-500/10' : 'border-white/10 ring-primary/10'} bg-primary/5 text-card-text placeholder:text-card-text/40 focus:bg-card focus:border-primary focus:ring-4 sm:text-sm transition-all duration-200 shadow-sm min-h-[160px] outline-none font-bold`}
                                placeholder="123 Education Lane, Learning City"
                            />
                        </div>
                        {errors.address && <p className="mt-1 text-xs text-red-500 font-bold">{errors.address.message}</p>}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 pb-12">
                <Button type="button" variant="secondary" className="w-32" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" className="w-64 h-12" disabled={isSaving}>
                    {isSaving ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="font-black uppercase tracking-widest text-[10px]">Processing...</span>
                        </div>
                    ) : (
                        <span className="font-black uppercase tracking-widest text-[10px] italic">
                            {studentId ? 'Update Student Record' : 'Register Student'}
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
}
