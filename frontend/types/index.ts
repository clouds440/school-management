import { Role, TeacherStatus, StudentStatus, MailStatus, MailCategory, OrganizationType, OrgStatus, AssessmentType, GradeStatus, ChatType, ChatParticipantRole, ChatMessageType, TargetType, AnnouncementPriority, ThemeMode } from './enums';
export { Role, TeacherStatus, StudentStatus, MailStatus, MailCategory, OrganizationType, OrgStatus, AssessmentType, GradeStatus, ChatType, ChatParticipantRole, ChatMessageType, TargetType, AnnouncementPriority, ThemeMode } from './enums';

export interface PaginatedResponse<T> {
    data: T[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    counts?: Record<string, number>;
    hasMoreBefore?: boolean;
    hasMoreAfter?: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    userName: string;
    role: Role;
    phone?: string;
    avatarUrl?: string | null;
    avatarUpdatedAt?: string | null;
    organizationId?: string | null;
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
    accentColor?: { primary?: string; secondary?: string; mode?: ThemeMode } | null;
    status: OrgStatus;
    statusHistory?: StatusHistoryEntry[];
    createdAt: string;
    adminUserId?: string;
}

export interface RegisterRequest {
    name: string;
    adminName: string;
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
    accentColor?: { primary?: string; secondary?: string; mode?: ThemeMode };
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

// ─── Mail System Types ────────────────────────────────────────────────────────

export interface MailUser {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatarUrl?: string | null;
}

export interface MailOrg {
    id: string;
    name: string;
    logoUrl?: string | null;
}

export interface MailMessage {
    id: string;
    mailId: string;
    senderId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    sender: MailUser;
    files?: Attachment[];
}

export interface MailActionLog {
    id: string;
    mailId: string;
    performedBy: string;
    action: string;
    details?: Record<string, unknown> | null;
    note?: string | null;
    createdAt: string;
    performer: { id: string; name: string | null; role: string };
}

export interface MailUserView {
    userId: string;
    mailId: string;
    lastViewedAt: string;
}

/** Summary item returned in list views */
export interface MailItem {
    id: string;
    subject: string;
    category: MailCategory;
    priority: string;
    status: MailStatus;
    creatorId: string;
    creatorRole: string;
    organizationId: string | null;
    targetRole: string | null;
    assigneeId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    creator: MailUser;
    assignee: MailUser | null;
    assignees: MailUser[];
    organization: MailOrg | null;
    _count: { messages: number };
    unreadCount: number;
}

/** Full detail returned when viewing a single mail thread */
export interface MailDetail extends MailItem {
    messages: MailMessage[];
    actionLogs: MailActionLog[];
    userViews: MailUserView[];
}

export interface CreateMailPayload {
    subject: string;
    category: MailCategory;
    priority?: string;
    message: string;
    targetRole?: string;
    assigneeIds?: string[];
    metadata?: Record<string, unknown>;
    noReply?: boolean;
}

export interface UpdateMailPayload {
    status?: MailStatus;
    assigneeId?: string;
    priority?: string;
}

export interface MailTarget {
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

// ─── Communication System Types ──────────────────────────────────────────────

export interface ChatParticipant {
    id: string;
    chatId: string;
    userId: string;
    role: ChatParticipantRole;
    isActive: boolean;
    lastReadMessageId: string | null;
    joinedAt: string;
    user?: User;
}

export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    organizationId?: string | null;
    content: string;
    type: ChatMessageType;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    deletedById?: string | null;
    sender?: User;
    deletedBy?: User;
    chat?: Partial<Chat>;
    replyToId?: string | null;
    replyTo?: ChatMessage | null;
}

export interface Chat {
    id: string;
    type: ChatType;
    name: string | null;
    avatarUrl?: string | null;
    avatarUpdatedAt?: string | null;
    organizationId: string | null;
    creatorId: string;
    createdAt: string;
    updatedAt: string;
    participants?: ChatParticipant[];
    messages?: ChatMessage[];
    _count?: { messages: number };
    unreadCount?: number;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string | null;
    actionUrl: string | null;
    type: string | null;
    metadata: Record<string, unknown> | null;
    isRead: boolean;
    createdAt: string;
}

export interface Announcement {
    id: string;
    title: string;
    body: string;
    targetType: TargetType;
    targetId: string | null;
    actionUrl: string | null;
    priority: AnnouncementPriority;
    creatorId: string;
    organizationId: string | null;
    createdAt: string;
    creator?: User;
    organization?: Organization;
}
