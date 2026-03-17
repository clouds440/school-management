import { z } from 'zod';
import { OrganizationType, TeacherStatus, StudentStatus } from '@/types';

// --- Shared Patterns ---
const phoneRegex = /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/;

const passwordRules = z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

// For updates, the field can be empty to keep current password.
// If it has content, it MUST follow rules.
const optionalPasswordRules = z.string().optional().or(z.literal(''))
    .refine(val => !val || (val.length >= 8), 'Password must be at least 8 characters long')
    .refine(val => !val || /[A-Z]/.test(val), 'Password must contain at least one uppercase letter')
    .refine(val => !val || /[a-z]/.test(val), 'Password must contain at least one lowercase letter')
    .refine(val => !val || /[0-9]/.test(val), 'Password must contain at least one number');

// --- Registration Schema ---
export const registerSchema = z.object({
    name: z.string().min(1, 'Organization Name is required'),
    location: z.string().min(1, 'Location is required'),
    type: z.nativeEnum(OrganizationType),
    email: z.string().email('Invalid login email address'),
    contactEmail: z.string().email('Invalid contact email address').optional().or(z.literal('')),
    phone: z.string().regex(phoneRegex, 'Invalid phone number'),
    password: passwordRules,
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// --- Teacher Schema ---
export const teacherSchema = z.object({
    name: z.string().min(1, 'Full Name is required'),
    phone: z.string().regex(phoneRegex, 'Invalid phone number'),
    email: z.string().email('Invalid email address'),
    password: optionalPasswordRules,
    education: z.string().min(1, 'Education details are required'),
    designation: z.string().min(1, 'Designation is required'),
    subject: z.string().min(1, 'Subject expertise is required'),
    salary: z.string().nullable().optional(),
    department: z.string().min(1, 'Department is required'),
    joiningDate: z.string().min(1, 'Joining Date is required'),
    address: z.string().optional().or(z.literal('')),
    emergencyContact: z.string().optional().or(z.literal('')),
    bloodGroup: z.string().optional().or(z.literal('')),
    status: z.nativeEnum(TeacherStatus),
    isManager: z.boolean(),
    sectionIds: z.array(z.string()).min(1, 'At least one section must be assigned'),
});

export type TeacherFormData = z.infer<typeof teacherSchema>;

// --- Student Schema ---
export const studentSchema = z.object({
    name: z.string().min(1, 'Full Name is required'),
    email: z.string().email('Invalid email address'),
    password: optionalPasswordRules,
    registrationNumber: z.string().min(1, 'Registration number is required'),
    admissionDate: z.string().min(1, 'Admission date is required'),
    status: z.nativeEnum(StudentStatus),
    major: z.string().min(1, 'Major is required'),
    department: z.string().min(1, 'Department is required'),
    fatherName: z.string().optional().or(z.literal('')),
    age: z.string().nullable().optional(),
    gender: z.string().min(1, 'Gender is required'),
    fee: z.string().nullable().optional(),
    feePlan: z.string().optional().or(z.literal('')),
    graduationDate: z.string().optional().or(z.literal('')),
    phone: z.string().regex(phoneRegex, 'Invalid phone number'),
    emergencyContact: z.string().optional().or(z.literal('')),
    bloodGroup: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    sectionIds: z.array(z.string()).min(1, 'At least one section must be assigned'),
});

export type StudentFormData = z.infer<typeof studentSchema>;
