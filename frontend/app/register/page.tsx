'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { School, MapPin, Building, Mail, Lock, UserPlus, Phone, BookOpen, GraduationCap, Library, MonitorPlay, Pencil } from 'lucide-react';
import Link from 'next/link';
import { RegisterRequest, OrganizationType, ApiError } from '@/types';
import { Input } from '@/components/ui/Input';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { PhotoUploadPicker } from '@/components/ui/PhotoUploadPicker';
import { useGlobal } from '@/context/GlobalContext';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/schemas';

export default function RegisterPage() {
    const router = useRouter();
    const { state, dispatch } = useGlobal();
    const [sameAsLoginEmail, setSameAsLoginEmail] = useState(false);
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            location: '',
            type: OrganizationType.HIGH_SCHOOL,
            email: '',
            contactEmail: '',
            phone: '',
            password: '',
        }
    });

    const formData = watch();

    useEffect(() => {
        if (sameAsLoginEmail) {
            setValue('contactEmail', formData.email);
            if (errors.contactEmail) trigger('contactEmail');
        }
    }, [formData.email, sameAsLoginEmail, setValue, trigger, errors.contactEmail]);

    const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
        if (state.ui.isProcessing) return;
        dispatch({ type: 'UI_SET_PROCESSING', payload: true });
        try {
            const payload: RegisterRequest = {
                ...data,
                contactEmail: sameAsLoginEmail ? data.email : (data.contactEmail || data.email),
            };

            // 1. Register the org
            await api.auth.register(payload);

            // 2. Logo upload (optional, post-auth)
            if (pendingLogoFile) {
                try {
                    const loginRes = await api.auth.login({ email: data.email, password: data.password });
                    if (loginRes.access_token) {
                        await api.org.uploadLogo(pendingLogoFile, loginRes.access_token);
                    }
                } catch {
                    dispatch({ type: 'TOAST_ADD', payload: { message: 'Account created! Logo upload failed — you can add it from Settings.', type: 'info' } });
                }
            }

            dispatch({ type: 'TOAST_ADD', payload: { message: 'Registration successful! Please wait for approval.', type: 'success' } });
            router.push('/login');
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const message = error instanceof Error 
                ? error.message 
                : (apiError?.response?.data?.message || 'Registration failed');
            
            if (Array.isArray(message)) {
                message.forEach((m: string) => dispatch({ type: 'TOAST_ADD', payload: { message: m, type: 'error' } }));
            } else {
                dispatch({ type: 'TOAST_ADD', payload: { message: message as string, type: 'error' } });
            }
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleLogoReady = useCallback((file: File) => {
        setPendingLogoFile(file);
    }, []);

    return (
        <div className="flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-y-auto min-h-full">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl pointer-events-none">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 left-0 w-80 h-80 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-40 w-80 h-80 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-2xl space-y-10 bg-white/70 backdrop-blur-2xl p-12 sm:p-16 rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-white/50 relative z-10 mx-auto transition-all duration-500">
                <div className="text-center">
                    <div className="mx-auto bg-primary/10 w-20 h-20 rounded-sm flex items-center justify-center mb-8 shadow-inner border border-white/20">
                        <UserPlus className="w-10 h-10 text-primary drop-shadow-sm" />
                    </div>
                    <h2 className="mt-2 text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-700 tracking-tight">
                        Register Organization
                    </h2>
                    <p className="mt-3 text-sm text-gray-500 font-medium tracking-tight">
                        Already have an account?{' '}
                        <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                            Sign in here
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Logo picker */}
                    <div className="flex flex-col items-center pb-2">
                        <Label className="mb-3">
                            Organization Logo <span className="text-gray-400 font-normal">(optional)</span>
                        </Label>
                        <PhotoUploadPicker
                            onFileReady={handleLogoReady}
                            type="org"
                            hint="Square image, PNG or JPG, max 5 MB"
                        />
                    </div>

                    <div className="space-y-5">
                        <div>
                            <Label htmlFor="name">Organization Name</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                error={!!errors.name}
                                icon={School}
                                placeholder="EduPulse Academy"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500 font-bold">{errors.name.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <Label htmlFor="type">Organization Type</Label>
                                <CustomSelect
                                    options={[
                                        { value: OrganizationType.KINDERGARTEN, label: 'Kindergarten', icon: Pencil },
                                        { value: OrganizationType.PRE_SCHOOL, label: 'Pre-School', icon: Pencil },
                                        { value: OrganizationType.PRIMARY_SCHOOL, label: 'Primary School', icon: BookOpen },
                                        { value: OrganizationType.MIDDLE_SCHOOL, label: 'Middle School', icon: BookOpen },
                                        { value: OrganizationType.HIGH_SCHOOL, label: 'High School', icon: School },
                                        { value: OrganizationType.COLLEGE, label: 'College', icon: Library },
                                        { value: OrganizationType.UNIVERSITY, label: 'University', icon: GraduationCap },
                                        { value: OrganizationType.VOCATIONAL_SCHOOL, label: 'Vocational School', icon: Building },
                                        { value: OrganizationType.INSTITUTE, label: 'Institute', icon: Building },
                                        { value: OrganizationType.ACADEMY, label: 'Academy', icon: Building },
                                        { value: OrganizationType.TUTORING_CENTER, label: 'Tutoring Center', icon: BookOpen },
                                        { value: OrganizationType.ONLINE_SCHOOL, label: 'Online School', icon: MonitorPlay },
                                        { value: OrganizationType.OTHER, label: 'Other', icon: Building },
                                    ]}
                                    value={formData.type}
                                    onChange={(val) => {
                                        setValue('type', val as OrganizationType);
                                        trigger('type');
                                    }}
                                    error={!!errors.type}
                                    placeholder="Select Type"
                                />
                                {errors.type && <p className="mt-1 text-xs text-red-500 font-bold">{errors.type.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    {...register('location')}
                                    error={!!errors.location}
                                    icon={MapPin}
                                    placeholder="New York, USA"
                                />
                                {errors.location && <p className="mt-1 text-xs text-red-500 font-bold">{errors.location.message}</p>}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Admin Login Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register('email')}
                                error={!!errors.email}
                                icon={Mail}
                                placeholder="admin@school.com"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500 font-bold">{errors.email.message}</p>}
                            <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                This will be used for your administrator login account.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label htmlFor="contactEmail">Organization Contact Email</Label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = !sameAsLoginEmail;
                                        setSameAsLoginEmail(next);
                                        if (next) {
                                            setValue('contactEmail', formData.email);
                                            trigger('contactEmail');
                                        }
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                >
                                    {sameAsLoginEmail ? 'Use different email' : 'Same as login email'}
                                </button>
                            </div>
                            <Input
                                id="contactEmail"
                                type="email"
                                {...register('contactEmail')}
                                error={!!errors.contactEmail}
                                disabled={sameAsLoginEmail}
                                icon={Mail}
                                placeholder="info@school.com"
                                className={sameAsLoginEmail ? 'bg-gray-50/50 opacity-60' : ''}
                            />
                            {errors.contactEmail && !sameAsLoginEmail && (
                                <p className="mt-1 text-xs text-red-500 font-bold">{errors.contactEmail.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    {...register('phone')}
                                    error={!!errors.phone}
                                    icon={Phone}
                                    placeholder="+1 (555) 000-0000"
                                />
                                {errors.phone && <p className="mt-1 text-xs text-red-500 font-bold">{errors.phone.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="password">Login Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    error={!!errors.password}
                                    icon={Lock}
                                    placeholder="••••••••"
                                />
                                {errors.password && <p className="mt-1 text-xs text-red-500 font-bold">{errors.password.message}</p>}
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-14" loadingText="Registering...">
                        <span className="font-black uppercase tracking-widest text-xs italic">Create Organization Account</span>
                    </Button>
                </form>
            </div>
        </div>
    );
}