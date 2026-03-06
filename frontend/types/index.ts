export interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'ORG_ADMIN' | 'TEACHER' | 'STUDENT';
    phone?: string;
    orgSlug?: string;
}

export interface Teacher {
    id: string;
    education?: string;
    designation?: string;
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
}
