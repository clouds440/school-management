import { Role, TeacherStatus, StudentStatus, RequestStatus, OrganizationType, OrgStatus, AssessmentType, GradeStatus } from './enums';
export { Role, TeacherStatus, StudentStatus, RequestStatus, OrganizationType, OrgStatus, AssessmentType, GradeStatus, RequestCategory } from './enums';

export interface PaginatedResponse<T> {
    data: T[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    counts?: Record<string, number>;
}

export interface User {
    id: string;
    name: string;
    email: string;
    userName: string;
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
    students?: Student[];
    studentsCount?: number;
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
    gender?: string | null;
    feePlan?: string | null;
    status?: StudentStatus;
    user: User;
    enrollments?: { section: Section }[];
    updatedBy?: string;
    updatedAt?: string;
}

export interface Attachment {
    id: string;
    orgId: string;
    entityType: string;
    entityId: string;
    path: string;
    filename: string;
    mimeType: string;
    size: number;
    uploadedBy: string;
    createdAt: string;
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
    adminUserId?: string;
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
    TOTAL_MAIL: number;
    UNREAD_MAIL: number;
    PLATFORM_ADMINS: number;
}

export interface OrgStats {
    TEACHERS: number;
    COURSES: number;
    SECTIONS: number;
    STUDENTS: number;
    PENDING_ASSESSMENTS?: number;
}

// ─── Request System Types ────────────────────────────────────────────────────

export interface RequestUser {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatarUrl?: string | null;
}

export interface RequestOrg {
    id: string;
    name: string;
    logoUrl?: string | null;
}

export interface RequestMessage {
    id: string;
    requestId: string;
    senderId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    sender: RequestUser;
    files?: Attachment[];
}

export interface RequestActionLog {
    id: string;
    requestId: string;
    performedBy: string;
    action: string;
    details?: Record<string, unknown> | null;
    note?: string | null;
    createdAt: string;
    performer: { id: string; name: string | null; role: string };
}

/** Summary item returned in list views */
export interface RequestItem {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: RequestStatus;
    creatorId: string;
    creatorRole: string;
    organizationId: string | null;
    targetRole: string | null;
    assigneeId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    creator: RequestUser;
    assignee: RequestUser | null;
    assignees: RequestUser[];
    organization: RequestOrg | null;
    _count: { messages: number };
    unreadCount: number;
}

export interface RequestUserView {
    userId: string;
    requestId: string;
    lastViewedAt: string;
}

/** Full detail returned when viewing a single request */
export interface RequestDetail extends RequestItem {
    messages: RequestMessage[];
    actionLogs: RequestActionLog[];
    userViews: RequestUserView[];
}

export interface CreateRequestPayload {
    subject: string;
    category: string;
    priority?: string;
    message: string;
    targetRole?: string;
    assigneeIds?: string[];
    metadata?: Record<string, unknown>;
}

export interface UpdateRequestPayload {
    status?: RequestStatus;
    assigneeId?: string;
    priority?: string;
}

export interface RequestTarget {
    id: string;
    label: string;
    email?: string;
    type: 'ROLE' | 'USER';
    role?: Role | 'ORG_STAFF';
    avatarUrl?: string | null;
    description?: string;
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

export interface Assessment {
    id: string;
    sectionId: string;
    courseId: string;
    organizationId: string;
    title: string;
    type: AssessmentType;
    totalMarks: number;
    weightage: number;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    allowSubmissions: boolean;
    externalLink?: string;
    isVideoLink?: boolean;
    files?: Attachment[];
    _count?: {
        grades: number;
        submissions: number;
    };
    section?: Section;
    grades?: Grade[];
}

export interface Grade {
    id: string;
    assessmentId: string;
    studentId: string;
    marksObtained: number;
    feedback?: string;
    status: GradeStatus;
    createdAt: string;
    updatedAt: string;
    updatedBy?: string;
    student?: Student;
}

export interface Submission {
    id: string;
    assessmentId: string;
    studentId: string;
    fileUrl?: string;
    submittedAt: string;
    student?: Student;
    files?: Attachment[];
}

export interface CreateAssessmentRequest {
    sectionId: string;
    courseId: string;
    title: string;
    type: AssessmentType;
    totalMarks: number;
    weightage: number;
    dueDate?: string;
    allowSubmissions?: boolean;
    externalLink?: string;
    isVideoLink?: boolean;
}

export type UpdateAssessmentRequest = Partial<CreateAssessmentRequest>;

export interface UpdateGradeRequest {
    marksObtained: number;
    feedback?: string;
    status?: GradeStatus;
}

export interface CreateSubmissionRequest {
    assessmentId: string;
    fileUrl?: string;
}

export interface FinalGradeDetail {
    assessmentId: string;
    title: string;
    type: AssessmentType;
    weightage: number;
    marksObtained: number;
    totalMarks: number;
    status: string;
    percentage: string;
}

export interface FinalGradeResponse {
    sectionId: string;
    sectionName: string;
    courseName: string;
    finalPercentage: number;
    letterGrade?: string;
    assessments: FinalGradeDetail[];
}

export interface ApiError {
    message?: string;
    status?: number;
    response?: {
        status?: number;
        data?: {
            message?: string | string[];
        };
    };
}
