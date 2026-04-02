'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { School, MapPin, Building, Mail, Lock, Phone, BookOpen, GraduationCap, Library, MonitorPlay, Pencil } from 'lucide-react';
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
import { PLATFORM_NAME } from '@/lib/constants';

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
            adminName: '',
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
        <div className="flex min-h-full h-screen bg-white overflow-hidden font-sans">
            {/* Left Column: Vision & Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-[40%] xl:w-[35%] relative flex-col items-center justify-center p-12 overflow-hidden bg-primary/5">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-secondary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

                <div className="relative z-10 w-full max-w-sm space-y-16 animate-in fade-in slide-in-from-left duration-1000">
                    <div className="space-y-4">
                        <h1 className="text-4xl xl:text-5xl font-black text-gray-900 leading-[1.1] tracking-tighter italic">
                            Grow your <br />
                            <span className="text-primary not-italic">Community.</span>
                        </h1>
                        <p className="text-base text-gray-500 font-medium leading-relaxed">
                            Join hundreds of modern educational institutions managing their future with {PLATFORM_NAME}.
                        </p>
                    </div>

                    <div className="relative w-full aspect-square drop-shadow-2xl">
                        <img
                            src="/assets/eduverse-logo.png"
                            alt="Growth Illustration"
                            className="w-full h-auto object-contain animate-float"
                        />
                    </div>
                </div>
            </div>

            {/* Right Column: Registration Form */}
            <div className="w-full lg:w-[60%] xl:w-[65%] flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white relative overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
                <div className="w-full max-w-2xl mt-auto">
                    <div className="flex flex-col space-y-2 mb-10">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight italic">
                            Register Organization
                        </h2>
                        <p className="text-sm text-gray-500 font-medium tracking-tight">
                            Start your digital transformation journey today with {PLATFORM_NAME}. Already have an account?{' '}
                            <Link href="/login" className="text-primary font-black hover:underline underline-offset-4 decoration-2 italic">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <form className="space-y-10" onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Logo & Core Info Section */}
                        <div className="bg-gray-50/50 p-8 rounded-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-10">
                            <div className="flex flex-col items-center shrink-0">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">Organization Logo</Label>
                                <PhotoUploadPicker
                                    onFileReady={handleLogoReady}
                                    type="org"
                                    hint="Square PNG/JPG, max 5MB"
                                />
                            </div>

                            <div className="flex-1 w-full space-y-6">
                                <div>
                                    <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Official School Name</Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        error={!!errors.name}
                                        icon={School}
                                        placeholder="EduPulse Academy"
                                        className="h-14 font-bold border-gray-100 bg-white"
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-500 font-bold ml-1">{errors.name.message}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="adminName" className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Administrator Full Name</Label>
                                    <Input
                                        id="adminName"
                                        {...register('adminName')}
                                        error={!!errors.adminName}
                                        icon={BookOpen}
                                        placeholder="John Doe"
                                        className="h-14 font-bold border-gray-100 bg-white"
                                    />
                                    {errors.adminName && <p className="mt-1 text-xs text-red-500 font-bold ml-1">{errors.adminName.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="space-y-8 px-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 italic border-l-4 border-gray-200 pl-4 mb-8">Metadata & Location</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <Label htmlFor="type" className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Category</Label>
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
                                        className="h-14 font-bold border-gray-100"
                                    />
                                    {errors.type && <p className="mt-1 text-xs text-red-500 font-bold ml-1">{errors.type.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="location" className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Location</Label>
                                    <Input
                                        id="location"
                                        {...register('location')}
                                        error={!!errors.location}
                                        icon={MapPin}
                                        placeholder="New York, USA"
                                        className="h-14 font-bold border-gray-100"
                                    />
                                    {errors.location && <p className="mt-1 text-xs text-red-500 font-bold ml-1">{errors.location.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Security & Access Section */}
                        <div className="space-y-8 px-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 italic border-l-4 border-gray-200 pl-4 mb-8">Security & Access</h3>

                            <div className="space-y-8">
                                <div>
                                    <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Admin Login Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        error={!!errors.email}
                                        icon={Mail}
                                        placeholder="admin@school.com"
                                        className="h-14 font-bold border-gray-100"
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-red-500 font-bold ml-1">{errors.email.message}</p>}
                                    <p className="mt-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1 italic opacity-60">
                                        Primary credentials used for administrator console access.
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2 ml-1">
                                        <Label htmlFor="contactEmail" className="text-[11px] font-black uppercase tracking-widest text-gray-400">Public Contact Email</Label>
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
                                            className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary-hover italic transition-all"
                                        >
                                            {sameAsLoginEmail ? 'Different email' : 'Sync with Login'}
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
                                        className={`h-14 font-bold border-gray-100 transition-all ${sameAsLoginEmail ? 'bg-gray-50 opacity-40 grayscale pointer-events-none' : ''}`}
                                    />
                                    {errors.contactEmail && !sameAsLoginEmail && (
                                        <p className="mt-1 text-xs text-red-500 font-bold ml-1">{errors.contactEmail.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <Label htmlFor="phone" className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            {...register('phone')}
                                            error={!!errors.phone}
                                            icon={Phone}
                                            placeholder="+1 (555) 000-0000"
                                            className="h-14 font-bold border-gray-100"
                                        />
                                        {errors.phone && <p className="mt-1 text-xs text-red-500 font-bold ml-1">{errors.phone.message}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Login Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            {...register('password')}
                                            error={!!errors.password}
                                            icon={Lock}
                                            placeholder="••••••••"
                                            className="h-14 font-bold border-gray-100"
                                        />
                                        {errors.password && <p className="mt-1 text-xs text-red-500 font-bold ml-1">{errors.password.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button
                                type="submit"
                                className="w-full h-14"
                                loadingText="Creating account..."
                            >
                                <span className="font-black uppercase text-sm">Create Organization Account</span>
                            </Button>
                            <p className="mt-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-sm mx-auto">
                                By registering, you agree to our <Link href="/terms" className="text-gray-500 hover:text-primary underline italic">Terms of Service</Link> and <Link href="/privacy" className="text-gray-500 hover:text-primary underline italic">Privacy Policy</Link>.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}