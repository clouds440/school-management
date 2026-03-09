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
    user: User;
}

export interface Class {
    id: string;
    name: string;
    description?: string;
    grade?: string;
    courses: string[];
    teacherId?: string;
    teacher?: Teacher;
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
    user: User;
    classId?: string;
    class?: Class;
    updatedBy?: string;
    updatedAt?: string;
}
