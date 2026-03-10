export interface User {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'ORG_ADMIN' | 'ORG_MANAGER' | 'TEACHER' | 'STUDENT';
    phone?: string;
    orgSlug?: string;
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
    status?: 'ACTIVE' | 'SUSPENDED' | 'ON_LEAVE';
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
    status?: 'ACTIVE' | 'SUSPENDED' | 'ALUMNI';
    user: User;
    enrollments?: { section: Section }[];
    updatedBy?: string;
    updatedAt?: string;
}
