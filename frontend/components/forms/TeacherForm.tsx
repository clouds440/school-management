'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, BookOpen, DollarSign, Phone, Plus, ShieldCheck, UserX, CalendarClock, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { Section, Teacher, TeacherStatus, Role, CreateTeacherRequest, UpdateTeacherRequest, ApiError } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomMultiSelect } from '@/components/ui/CustomMultiSelect';
import { PhotoUploadPicker } from '@/components/ui/PhotoUploadPicker';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teacherCreateSchema, teacherUpdateSchema, teacherProfileSchema, TeacherCreateFormData, TeacherUpdateFormData, TeacherProfileFormData } from '@/lib/schemas';

interface TeacherFormProps {
    teacherId?: string;
    orgSlug: string;
    initialData?: Teacher;
    isProfile?: boolean;
}

export default function TeacherForm({ teacherId, orgSlug, initialData, isProfile }: TeacherFormProps) {
    const { token, user: currentUser, updateUser } = useAuth();
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
        resolver: zodResolver(isProfile ? teacherProfileSchema : (teacherId ? teacherUpdateSchema : teacherCreateSchema)),
        defaultValues: initialData ? {
            name: initialData.user?.name || '',
            phone: initialData.user?.phone || '',
            email: initialData.user?.email || '',
            password: '',
            education: initialData.education || '',
            designation: initialData.designation || '',
            subject: initialData.subject || '',
            salary: initialData.salary?.toString() || '',
            isManager: !!(initialData.user?.role === Role.ORG_MANAGER),
            department: initialData.department || '',
            joiningDate: initialData.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            address: initialData.address || '',
            emergencyContact: initialData.emergencyContact || '',
            bloodGroup: initialData.bloodGroup || '',
            status: initialData.status as TeacherStatus || TeacherStatus.ACTIVE,
            sectionIds: initialData.sections?.map(s => s.id) || []
        } : {
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
            status: TeacherStatus.ACTIVE,
            sectionIds: []
        }
    });

    const formData = watch();

    const onSubmit: SubmitHandler<TeacherCreateFormData | TeacherUpdateFormData | TeacherProfileFormData> = async (data) => {
        setIsSaving(true);
        try {
            const { password, salary, ...rest } = data;
            const payload: CreateTeacherRequest | UpdateTeacherRequest = {
                ...rest,
                salary: salary ? Number(salary) : null,
                ...(teacherId ? (password ? { password } : {}) : { password })
            };

            let savedTeacher: Teacher;
            if (isProfile) {
                savedTeacher = await api.org.updateProfile<Teacher>(payload as UpdateTeacherRequest, token!);
            } else if (teacherId) {
                savedTeacher = await api.org.updateTeacher(teacherId, payload as UpdateTeacherRequest, token!);
            } else {
                savedTeacher = await api.org.createTeacher(payload as CreateTeacherRequest, token!);
            }

            if (pendingPhoto && savedTeacher.userId) {
                try {
                    const updatedUser = await api.org.uploadAvatar(savedTeacher.userId, pendingPhoto, token!);
                    // Sync local auth state if the updated user is the current user
                    if (currentUser?.id === savedTeacher.userId) {
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
            showToast(`${isProfile ? 'Profile' : 'Teacher account'} ${teacherId || isProfile ? 'updated' : 'created'} successfully`, 'success');
            if (isProfile) {
                router.back();
            } else {
                router.push(`/${orgSlug}/teachers`);
            }
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const message = apiError?.response?.data?.message || 'Failed to save teacher';
            
            if (Array.isArray(message)) {
                message.forEach((m: string) => showToast(m, 'error'));
            } else {
                showToast(message, 'error');
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
            {/* Mandatory Information */}
            <div className="bg-primary/5 p-6 rounded-sm border border-white/10">
                <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                    <div className="shrink-0 group relative">
                        <PhotoUploadPicker
                            onFileReady={handlePhotoReady}
                            type="user"
                            currentImageUrl={initialData?.user?.avatarUrl}
                        />
                        <p className="mt-3 text-[10px] text-center font-black uppercase tracking-widest text-card-text/40 group-hover:text-primary transition-colors">
                            {teacherId ? 'Update Photo' : 'Upload Photo'}
                        </p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                type="text"
                                {...register('name')}
                                onChange={isProfile ? undefined : register('name').onChange}
                                readOnly={isProfile}
                                value={watch('name') || ''}
                                error={!!errors.name}
                                disabled={isProfile}
                                icon={User}
                                placeholder="Dr. Sarah Wilson"
                                className={isProfile ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500 font-bold">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <CustomSelect
                                options={[
                                    { value: TeacherStatus.ACTIVE, label: 'Active', icon: ShieldCheck },
                                    { value: TeacherStatus.SUSPENDED, label: 'Suspended', icon: UserX },
                                    { value: TeacherStatus.ON_LEAVE, label: 'On Leave', icon: CalendarClock }
                                ]}
                                value={formData.status}
                                onChange={(val) => {
                                    if (isProfile) return;
                                    setValue('status', val as TeacherStatus);
                                    trigger('status');
                                }}
                                error={!!errors.status}
                                disabled={isProfile}
                                icon={
                                    formData.status === TeacherStatus.ACTIVE ? ShieldCheck :
                                        formData.status === TeacherStatus.SUSPENDED ? UserX : CalendarClock
                                }
                            />
                            {errors.status && <p className="mt-1 text-xs text-red-500 font-bold">{errors.status.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                {...register('email')}
                                onChange={(!!teacherId || isProfile) ? undefined : register('email').onChange}
                                readOnly={!!teacherId || isProfile}
                                value={watch('email') || ''}
                                error={!!errors.email}
                                disabled={!!teacherId || isProfile}
                                icon={Mail}
                                placeholder="sarah.wilson@school.com"
                                className={teacherId || isProfile ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500 font-bold">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Account Password</Label>
                            <Input
                                type="password"
                                {...register('password')}
                                error={!!errors.password}
                                icon={Lock}
                                placeholder={teacherId ? "Leave blank to keep current" : "Min 8 chars, 1 upper, 1 lower, 1 num"}
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-500 font-bold">{errors.password.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Education / Degree <span className="text-red-500">*</span></Label>
                        <Input
                            type="text"
                            {...register('education')}
                            onChange={isProfile ? undefined : register('education').onChange}
                            readOnly={isProfile}
                            value={watch('education') || ''}
                            error={!!errors.education}
                            disabled={isProfile}
                            icon={BookOpen}
                            placeholder="Ph.D. in Computer Science"
                            className={isProfile ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {errors.education && <p className="mt-1 text-xs text-red-500 font-bold">{errors.education.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Designation <span className="text-red-500">*</span></Label>
                        <Input
                            type="text"
                            {...register('designation')}
                            onChange={isProfile ? undefined : register('designation').onChange}
                            readOnly={isProfile}
                            value={watch('designation') || ''}
                            error={!!errors.designation}
                            disabled={isProfile}
                            icon={User}
                            placeholder="Senior Faculty / HOD"
                            className={isProfile ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {errors.designation && <p className="mt-1 text-xs text-red-500 font-bold">{errors.designation.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Subject Expertise <span className="text-red-500">*</span></Label>
                        <Input
                            type="text"
                            {...register('subject')}
                            onChange={isProfile ? undefined : register('subject').onChange}
                            readOnly={isProfile}
                            value={watch('subject') || ''}
                            error={!!errors.subject}
                            disabled={isProfile}
                            icon={BookOpen}
                            placeholder="Mathematics / AI / Physics"
                            className={isProfile ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {errors.subject && <p className="mt-1 text-xs text-red-500 font-bold">{errors.subject.message}</p>}
                    </div>
                </div>
            </div>

            {/* Workplace & Compensation */}
            <div className="bg-card p-8 rounded-sm border border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-sm">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-card-text">Workplace & Compensation</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <Label>Monthly Salary <span className="text-red-500">*</span></Label>
                        <Input
                            type="number"
                            {...register('salary')}
                            onChange={isProfile ? undefined : register('salary').onChange}
                            readOnly={isProfile}
                            value={watch('salary') || ''}
                            error={!!errors.salary}
                            disabled={isProfile}
                            icon={DollarSign}
                            placeholder="5000"
                            className={isProfile ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {errors.salary && <p className="mt-1 text-xs text-red-500 font-bold">{errors.salary.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Input
                            type="text"
                            {...register('department')}
                            error={!!errors.department}
                            icon={BookOpen}
                            placeholder="Computer Science"
                        />
                        {errors.department && <p className="mt-1 text-xs text-red-500 font-bold">{errors.department.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Joining Date</Label>
                        <Input
                            type="date"
                            {...register('joiningDate')}
                            onChange={isProfile ? undefined : register('joiningDate').onChange}
                            readOnly={isProfile}
                            value={watch('joiningDate') || ''}
                            error={!!errors.joiningDate}
                            disabled={isProfile}
                            className={isProfile ? 'opacity-70 cursor-not-allowed bg-white/5' : ''}
                        />
                        {errors.joiningDate && <p className="mt-1 text-xs text-red-500 font-bold">{errors.joiningDate.message}</p>}
                    </div>
                </div>

                <div className="mt-8 p-5 bg-primary/5 rounded-sm border border-primary/10 flex items-center justify-between group hover:bg-primary/10 transition-all">
                    <div className={`flex items-center gap-4 ${currentUser?.role !== Role.ORG_ADMIN ? 'pointer-events-none opacity-70' : ''}`}>
                        <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 cursor-pointer ${formData.isManager ? 'bg-primary' : 'bg-gray-200'}`}
                            onClick={() => {
                                if (currentUser?.role !== Role.ORG_ADMIN) return;
                                setValue('isManager', !formData.isManager);
                                trigger('isManager');
                            }}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${formData.isManager ? 'left-7' : 'left-1'}`} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-card-text">Administrative Privileges</p>
                            <p className="text-[10px] font-bold text-card-text/40 uppercase tracking-tight mt-0.5">Allow this teacher to manage school settings and users</p>
                        </div>
                    </div>
                    {formData.isManager && (
                        <div className="px-3 py-1 bg-primary/20 rounded-sm border border-primary/20 animate-in fade-in zoom-in">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic outline-none">Manager Mode Active</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Assignments */}
            <div className="bg-card p-8 rounded-sm border border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-sm">
                        <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-card-text">Section Assignments</h3>
                </div>

                <div className="space-y-2 max-w-2xl">
                    <Label>Assign to Sections</Label>
                    <CustomMultiSelect
                        options={sections.map(s => ({
                            value: s.id,
                            label: `${s.name} ${s.course?.name ? `(${s.course.name})` : ''}`
                        }))}
                        values={formData.sectionIds || []}
                        onChange={(vals) => {
                            if (isProfile) return;
                            setValue('sectionIds', vals);
                            trigger('sectionIds');
                        }}
                        placeholder="Choose one or more sections..."
                        error={!!errors.sectionIds}
                        disabled={isProfile}
                    />
                    {errors.sectionIds && <p className="mt-1 text-xs text-red-500 font-bold">{errors.sectionIds.message}</p>}
                    <p className="text-[10px] font-bold text-card-text/40 uppercase tracking-[0.05em] pt-2">
                        Teacher will be able to manage students and grading for selected sections.
                    </p>
                </div>
            </div>

            {/* Personal Details */}
            <div className="bg-card p-8 rounded-sm border border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-sm">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-card-text">Personal Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Contact Phone <span className="text-red-500">*</span></Label>
                            <Input
                                type="text"
                                {...register('phone')}
                                error={!!errors.phone}
                                icon={Phone}
                                placeholder="+1 555-0123"
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
                                placeholder="Name - Relation - Phone"
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
                                placeholder="O+, A-, etc."
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
                            {isProfile ? 'Update Profile' : (teacherId ? 'Update Faculty Member' : 'Create Faculty Account')}
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
}
