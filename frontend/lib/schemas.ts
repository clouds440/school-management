import { z } from 'zod';
import { OrganizationType, TeacherStatus, StudentStatus } from '@/types';

// --- Shared Patterns ---
const phoneRegex = /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/;

// --- Password Rules (Single Source of Truth) ---
const passwordRules = z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

// Optional password (for updates only)
const optionalPasswordRules = z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
        if (!val) return true;
        return passwordRules.safeParse(val).success;
    }, {
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, and number',
    });

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

// =========================
// --- TEACHER SCHEMAS ---
// =========================

const teacherBaseSchema = z.object({
    name: z.string().min(1, 'Full Name is required'),
    phone: z.string().regex(phoneRegex, 'Invalid phone number'),
    email: z.string().email('Invalid email address'),
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

// Create → password REQUIRED
export const teacherCreateSchema = teacherBaseSchema.extend({
    password: passwordRules,
});

// Update → password OPTIONAL
export const teacherUpdateSchema = teacherBaseSchema.extend({
    password: optionalPasswordRules,
});

export type TeacherCreateFormData = z.infer<typeof teacherCreateSchema>;
export type TeacherUpdateFormData = z.infer<typeof teacherUpdateSchema>;

// =========================
// --- STUDENT SCHEMAS ---
// =========================

const studentBaseSchema = z.object({
    name: z.string().min(1, 'Full Name is required'),
    email: z.string().email('Invalid email address'),
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

// Create → password REQUIRED
export const studentCreateSchema = studentBaseSchema.extend({
    password: passwordRules,
});

// Update → password OPTIONAL
export const studentUpdateSchema = studentBaseSchema.extend({
    password: optionalPasswordRules,
});

export type StudentCreateFormData = z.infer<typeof studentCreateSchema>;
export type StudentUpdateFormData = z.infer<typeof studentUpdateSchema>;
