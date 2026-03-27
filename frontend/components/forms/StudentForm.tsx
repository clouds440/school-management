'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Hash, ShieldCheck, UserX, GraduationCap, BookOpen, MapPin, Phone, Plus, Users, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import { useGlobal } from '@/context/GlobalContext';
import { Section, Student, StudentStatus, CreateStudentRequest, UpdateStudentRequest, Role, ApiError } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomMultiSelect } from '@/components/ui/CustomMultiSelect';
import { PhotoUploadPicker } from '@/components/ui/PhotoUploadPicker';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentCreateSchema, studentUpdateSchema, studentProfileSchema, StudentCreateFormData, StudentUpdateFormData, StudentProfileFormData } from '@/lib/schemas';

interface StudentFormProps {
    studentId?: string;
    orgSlug: string;
    initialData?: Student;
    isProfile?: boolean;
}

export default function StudentForm({ studentId, orgSlug, initialData, isProfile }: StudentFormProps) {
    const { token, user: currentUser, updateUser } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const { state, dispatch } = useGlobal();
    const isProcessing = state.ui.isProcessing;

    const [sections, setSections] = useState<Section[]>([]);
    const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(isProfile ? studentProfileSchema : (studentId ? studentUpdateSchema : studentCreateSchema)),
        defaultValues: initialData ? {
            name: initialData.user?.name || '',
            email: initialData.user?.email || '',
            password: '',
            registrationNumber: initialData.registrationNumber || '',
            rollNumber: initialData.rollNumber || '',
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
            rollNumber: '',
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

    const onSubmit: SubmitHandler<StudentCreateFormData | StudentUpdateFormData | StudentProfileFormData> = async (data) => {
        dispatch({ type: 'UI_SET_PROCESSING', payload: true });
        try {
            const { password, fee, age, ...rest } = data;
            const payload: CreateStudentRequest | UpdateStudentRequest = {
                ...rest,
                fee: fee ? Number(fee) : null,
                age: age ? Number(age) : null,
                ...(studentId ? (password ? { password } : {}) : { password })
            };

            let savedStudent: Student;
            if (isProfile) {
                savedStudent = await api.org.updateProfile<Student>(payload as UpdateStudentRequest, token!);
            } else if (studentId) {
                savedStudent = await api.org.updateStudent(studentId, payload as UpdateStudentRequest, token!);
            } else {
                savedStudent = await api.org.createStudent(payload as CreateStudentRequest, token!);
            }

            // Sync global auth state if the updated student is the current user
            if ((isProfile || studentId === initialData?.id) && currentUser?.id === savedStudent.userId) {
                updateUser({
                    name: savedStudent.user.name,
                    email: savedStudent.user.email,
                });
                dispatch({ type: 'AUTH_SET_PROFILE', payload: savedStudent });
            }

            if (pendingPhoto && savedStudent.userId) {
                try {
                    const updatedUser = await api.org.uploadAvatar(savedStudent.userId, pendingPhoto, token!);
                    // Sync local auth state if the updated user is the current user
                    if (currentUser?.id === savedStudent.userId) {
                        updateUser({
                            avatarUrl: updatedUser.avatarUrl,
                            avatarUpdatedAt: updatedUser.avatarUpdatedAt?.toString()
                        });
                    }
                } catch {
                    showToast('Profile updated, but photo upload failed', 'info');
                }
            }

            window.dispatchEvent(new Event('stats-updated'));
            showToast(`${isProfile ? 'Profile' : (studentId ? 'Record' : 'Student')} ${studentId || isProfile ? 'updated' : 'registered'} successfully.`, 'success');
            if (isProfile) {
                router.refresh();
            } else {
                router.push(`/${orgSlug}/students`);
            }
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const message = apiError?.response?.data?.message || 'Failed to save student';

            if (Array.isArray(message)) {
                message.forEach((m: string) => showToast(m, 'error'));
            } else {
                showToast(message, 'error');
            }
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
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

    const isWatchMode = !isProfile && currentUser?.role === Role.TEACHER;

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
                            disabled={isWatchMode}
                        />
                        {!isWatchMode && (
                            <p className="mt-3 text-[10px] text-center font-black uppercase tracking-widest text-card-text/40 group-hover:text-primary transition-colors">
                                {studentId ? 'Update Photo' : 'Upload Photo'}
                            </p>
                        )}
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                type="text"
                                {...register('name')}
                                onChange={(isProfile || isWatchMode) ? undefined : register('name').onChange}
                                readOnly={isProfile || isWatchMode}
                                value={watch('name') || ''}
                                error={!!errors.name}
                                disabled={isProfile || isWatchMode}
                                icon={User}
                                placeholder="Alex Johnson"
                                className={isProfile || isWatchMode ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500 font-bold">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Account Email</Label>
                            <Input
                                type="email"
                                {...register('email')}
                                onChange={(!!studentId || isProfile || isWatchMode) ? undefined : register('email').onChange}
                                readOnly={!!studentId || isProfile || isWatchMode}
                                value={watch('email') || ''}
                                error={!!errors.email}
                                disabled={!!studentId || isProfile || isWatchMode}
                                icon={Mail}
                                placeholder="alex.j@example.com"
                                className={studentId || isProfile || isWatchMode ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500 font-bold">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Login Password</Label>
                            <Input
                                type="password"
                                {...register('password')}
                                error={!!errors.password}
                                disabled={isWatchMode}
                                icon={Lock}
                                placeholder={studentId ? "Leave blank to keep current" : "Min 8 chars, 1 upper, 1 lower, 1 num"}
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-500 font-bold">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Registration Number <span className="text-red-500">*</span></Label>
                            <Input
                                type="text"
                                {...register('registrationNumber')}
                                onChange={(isProfile || isWatchMode || (!!studentId && currentUser?.role !== Role.ORG_ADMIN)) ? undefined : register('registrationNumber').onChange}
                                readOnly={isProfile || isWatchMode || (!!studentId && currentUser?.role !== Role.ORG_ADMIN)}
                                value={watch('registrationNumber') || ''}
                                error={!!errors.registrationNumber}
                                disabled={isProfile || isWatchMode || (!!studentId && currentUser?.role !== Role.ORG_ADMIN)}
                                icon={Hash}
                                placeholder="ST-2026-001"
                                className={isProfile || isWatchMode || (!!studentId && currentUser?.role !== Role.ORG_ADMIN) ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                            />
                            {errors.registrationNumber && <p className="mt-1 text-xs text-red-500 font-bold">{errors.registrationNumber.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Roll Number <span className="text-red-500">*</span></Label>
                            <Input
                                type="text"
                                {...register('rollNumber')}
                                onChange={(isProfile || isWatchMode || (!!studentId && currentUser?.role !== Role.ORG_ADMIN)) ? undefined : register('rollNumber').onChange}
                                readOnly={isProfile || isWatchMode || (!!studentId && currentUser?.role !== Role.ORG_ADMIN)}
                                value={watch('rollNumber') || ''}
                                error={!!errors.rollNumber}
                                disabled={isProfile || isWatchMode || (!!studentId && currentUser?.role !== Role.ORG_ADMIN)}
                                icon={Hash}
                                placeholder="2026-001"
                                className={isProfile || isWatchMode || (!!studentId && currentUser?.role !== Role.ORG_ADMIN) ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                            />
                            {errors.rollNumber && <p className="mt-1 text-xs text-red-500 font-bold">{errors.rollNumber.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Admission Date</Label>
                            <Input
                                type="date"
                                {...register('admissionDate')}
                                onChange={(isProfile || isWatchMode) ? undefined : register('admissionDate').onChange}
                                readOnly={isProfile || isWatchMode}
                                value={watch('admissionDate') || ''}
                                error={!!errors.admissionDate}
                                disabled={isProfile || isWatchMode}
                                className={isProfile || isWatchMode ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
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
                                    if (isProfile || isWatchMode) return;
                                    setValue('status', val as StudentStatus);
                                    trigger('status');
                                }}
                                error={!!errors.status}
                                disabled={isProfile || isWatchMode}
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
                        <Label>Major / Program <span className="text-red-500">*</span></Label>
                        <Input
                            type="text"
                            {...register('major')}
                            onChange={(isProfile || isWatchMode) ? undefined : register('major').onChange}
                            readOnly={isProfile || isWatchMode}
                            value={watch('major') || ''}
                            error={!!errors.major}
                            disabled={isProfile || isWatchMode}
                            icon={GraduationCap}
                            placeholder="Computer Science"
                            className={isProfile || isWatchMode ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {errors.major && <p className="mt-1 text-xs text-red-500 font-bold">{errors.major.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Input
                            type="text"
                            {...register('department')}
                            onChange={(isProfile || isWatchMode) ? undefined : register('department').onChange}
                            readOnly={isProfile || isWatchMode}
                            value={watch('department') || ''}
                            error={!!errors.department}
                            disabled={isProfile || isWatchMode}
                            icon={BookOpen}
                            placeholder="Engineering & Tech"
                            className={isProfile || isWatchMode ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
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
                        values={formData.sectionIds || []}
                        onChange={(vals) => {
                            if (isProfile || isWatchMode) return;
                            setValue('sectionIds', vals);
                            trigger('sectionIds');
                        }}
                        placeholder="Select one or more sections..."
                        error={!!errors.sectionIds}
                        disabled={isProfile || isWatchMode}
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
                        <Label>Annual/Semester Fee <span className="text-red-500">*</span></Label>
                        <Input
                            type="number"
                            {...register('fee')}
                            onChange={(isProfile || isWatchMode) ? undefined : register('fee').onChange}
                            readOnly={isProfile || isWatchMode}
                            value={watch('fee') || ''}
                            error={!!errors.fee}
                            disabled={isProfile || isWatchMode}
                            icon={DollarSign}
                            placeholder="12000"
                            className={isProfile || isWatchMode ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {errors.fee && <p className="mt-1 text-xs text-red-500 font-bold">{errors.fee.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Fee Plan <span className="text-red-500">*</span></Label>
                        <Input
                            type="text"
                            {...register('feePlan')}
                            onChange={(isProfile || isWatchMode) ? undefined : register('feePlan').onChange}
                            readOnly={isProfile || isWatchMode}
                            value={watch('feePlan') || ''}
                            error={!!errors.feePlan}
                            disabled={isProfile || isWatchMode}
                            icon={BookOpen}
                            placeholder="Standard / Installments"
                            className={isProfile || isWatchMode ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {errors.feePlan && <p className="mt-1 text-xs text-red-500 font-bold">{errors.feePlan.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Exp. Graduation</Label>
                        <Input
                            type="date"
                            {...register('graduationDate')}
                            onChange={(isProfile || isWatchMode) ? undefined : register('graduationDate').onChange}
                            readOnly={isProfile || isWatchMode}
                            value={watch('graduationDate') || ''}
                            error={!!errors.graduationDate}
                            disabled={isProfile || isWatchMode}
                            className={isProfile || isWatchMode ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
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
                            disabled={isWatchMode}
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
                            disabled={isWatchMode}
                            icon={User}
                            placeholder="16"
                        />
                        {errors.age && <p className="mt-1 text-xs text-red-500 font-bold">{errors.age.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Gender Identification <span className="text-red-500">*</span></Label>
                        <CustomSelect
                            options={[
                                { value: 'Male', label: 'Male' },
                                { value: 'Female', label: 'Female' },
                                { value: 'Other', label: 'Other' }
                            ]}
                            value={formData.gender || ''}
                            onChange={(val) => {
                                if (isProfile || isWatchMode) return;
                                setValue('gender', val);
                                trigger('gender');
                            }}
                            error={!!errors.gender}
                            disabled={isProfile || isWatchMode}
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
                                disabled={isWatchMode}
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
                                disabled={isWatchMode}
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
                                disabled={isWatchMode}
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
                                disabled={isWatchMode}
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
                    {isWatchMode ? 'Go Back' : 'Cancel'}
                </Button>
                {!isWatchMode && (
                    <Button type="submit" className="w-64 h-12" disabled={isProcessing}>
                        {isProcessing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="font-black uppercase tracking-widest text-[10px]">Processing...</span>
                            </div>
                        ) : (
                            <span className="font-black uppercase tracking-widest text-[10px] italic">
                                {isProfile ? 'Update Profile' : (studentId ? 'Update Student Record' : 'Register Student')}
                            </span>
                        )}
                    </Button>
                )}
            </div>
        </form>
    );
}
