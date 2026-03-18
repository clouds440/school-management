import { Role, TeacherStatus, StudentStatus, SupportTopic, OrganizationType, OrgStatus } from './enums';
export { Role, TeacherStatus, StudentStatus, SupportTopic, OrganizationType, OrgStatus } from './enums';

export interface PaginatedResponse<T> {
    data: T[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    counts?: {
        PENDING: number;
        APPROVED: number;
        REJECTED: number;
        SUSPENDED: number;
    };
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    phone?: string;
    orgSlug?: string;
    avatarUrl?: string | null;
    avatarUpdatedAt?: string | null;
}

export interface Teacher {
    id: string;
    education?: string;
    designation?: string;
    subject?: string;
    salary?: number;
    userId: string;
    department?: string;
    joiningDate?: string;
    emergencyContact?: string;
    bloodGroup?: string;
    address?: string;
    status?: TeacherStatus;
    user: User;
    sections?: Section[];
}

export interface Course {
    id: string;
    name: string;
    description?: string;
    updatedBy?: string;
    updatedAt?: string;
}

export interface Section {
    id: string;
    name: string;
    semester?: string;
    year?: string;
    room?: string;
    courseId?: string;
    course?: Course;
    teachers?: Teacher[];
    updatedBy?: string;
    updatedAt?: string;
}

export interface Student {
    id: string;
    registrationNumber?: string;
    rollNumber?: string;
    fatherName?: string;
    fee?: number;
    age?: number;
    address?: string;
    major?: string;
    userId: string;
    department?: string;
    admissionDate?: string;
    graduationDate?: string;
    emergencyContact?: string;
    bloodGroup?: string;
    gender?: string;
    feePlan?: string;
    status?: StudentStatus;
    user: User;
    enrollments?: { section: Section }[];
    updatedBy?: string;
    updatedAt?: string;
}

export interface StatusHistoryEntry {
    status: OrgStatus;
    message: string;
    adminName: string;
    adminRole: string;
    createdAt: string;
}

export interface Organization {
    id: string;
    name: string;
    location: string;
    type: OrganizationType;
    email: string;
    contactEmail: string;
    phone?: string;
    logoUrl?: string | null;
    avatarUpdatedAt?: string | null;
    accentColor?: { primary?: string; secondary?: string } | null;
    status: OrgStatus;
    statusHistory?: StatusHistoryEntry[];
    createdAt: string;
}

export interface RegisterRequest {
    name: string;
    location: string;
    type: OrganizationType;
    email: string;
    contactEmail: string;
    phone?: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface AuthResponse {
    id?: string;
    name?: string;
    email?: string;
    access_token?: string;
    message?: string;
    avatarUrl?: string | null;
    avatarUpdatedAt?: string | null;
}

export interface UpdateOrgSettingsRequest {
    name?: string;
    location?: string;
    contactEmail?: string;
    phone?: string;
    accentColor?: { primary?: string; secondary?: string };
}

export interface PlatformAdmin {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    createdAt: string;
}

export interface AdminStats {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
    SUSPENDED: number;
    SUPPORT: number;
    PLATFORM_ADMINS: number;
}

export interface OrgStats {
    TEACHERS: number;
    COURSES: number;
    SECTIONS: number;
    STUDENTS: number;
}

export interface SupportTicket {
    id: string;
    organizationId: string;
    organization?: Organization;
    topic: SupportTopic;
    message: string;
    isResolved: boolean;
    createdAt: string;
}

// Request Interfaces
export interface CreateTeacherRequest {
    name: string;
    email: string;
    phone?: string | null;
    password?: string;
    education?: string | null;
    designation?: string | null;
    subject?: string | null;
    salary?: number | null;
    department?: string | null;
    joiningDate?: string | null;
    emergencyContact?: string | null;
    bloodGroup?: string | null;
    address?: string | null;
    isManager?: boolean;
    status?: TeacherStatus;
    sectionIds?: string[];
}

export type UpdateTeacherRequest = Partial<CreateTeacherRequest>;

export interface CreateStudentRequest {
    name: string;
    email: string;
    phone?: string | null;
    password?: string;
    registrationNumber?: string | null;
    rollNumber?: string | null;
    fatherName?: string | null;
    fee?: number | null;
    age?: number | null;
    address?: string | null;
    major?: string | null;
    department?: string | null;
    admissionDate?: string | null;
    graduationDate?: string | null;
    emergencyContact?: string | null;
    bloodGroup?: string | null;
    gender?: string | null;
    feePlan?: string | null;
    status?: StudentStatus;
    sectionIds?: string[];
}

export type UpdateStudentRequest = Partial<CreateStudentRequest>;

export interface CreateSectionRequest {
    name: string;
    semester?: string;
    year?: string;
    room?: string;
    courseId: string;
}

export type UpdateSectionRequest = Partial<CreateSectionRequest>;

export interface CreateCourseRequest {
    name: string;
    description?: string;
}


export type UpdateCourseRequest = Partial<CreateCourseRequest>;

export interface ApiError {
    response?: {
        data?: {
            message?: string | string[];
        };
    };
}
