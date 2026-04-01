import {
    Teacher, Student, Organization, RegisterRequest, LoginRequest, AuthResponse,
    UpdateOrgSettingsRequest, PlatformAdmin, AdminStats, OrgStats, Section, Course,
    CreateTeacherRequest, UpdateTeacherRequest, CreateStudentRequest, UpdateStudentRequest,
    CreateSectionRequest, UpdateSectionRequest, CreateCourseRequest, UpdateCourseRequest,
    PaginatedResponse, OrgStatus, RequestItem, RequestDetail, CreateRequestPayload, UpdateRequestPayload,
    Assessment, Grade, Submission, CreateAssessmentRequest, UpdateAssessmentRequest,
    UpdateGradeRequest, CreateSubmissionRequest, FinalGradeResponse, RequestTarget,
    Chat, ChatMessage, Notification, Announcement, ChatType, TargetType, AnnouncementPriority, User
} from '@/types';


export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

export const getPublicUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
    unauthorizedHandler = handler;
};

interface RequestOptions extends RequestInit {
    token?: string;
}

interface QueryParams {
    [key: string]: string | number | boolean | undefined;
}

function buildQueryString(params: QueryParams): string {
    const query = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
    return query ? `?${query}` : '';
}

/**
 * Robust request helper to handle common chores
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, ...rest } = options;
    const headers = {
        ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...rest.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...rest, headers });

    if (response.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
    }

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const data = await response.json();
                message = Array.isArray(data.message) ? data.message[0] : data.message || message;
            } else {
                const text = await response.text();
                if (text && text.length < 200) message = text;
            }
        } catch (error) {
            console.error('Error parsing error response:', error);
        }
        throw new Error(message);
    }

    if (response.status === 204) return null as T;
    return response.json();
}

export const api = {
    auth: {
        register: (data: RegisterRequest) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
        login: (data: LoginRequest) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
        logout: (token: string) => request<void>('/auth/logout', { method: 'POST', token }).catch(e => console.warn('Logout failed', e)),
        changePassword: (oldPassword: string, newPassword: string, token: string) =>
            request<{ access_token: string, role: string }>('/auth/change-password', {
                method: 'POST', body: JSON.stringify({ oldPassword, newPassword }), token
            }),
    },

    admin: {
        getOrganizations: (token: string, params: { status?: OrgStatus, page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc', type?: string } = {}) =>
            request<PaginatedResponse<Organization>>(`/admin/organizations${buildQueryString(params)}`, { token }),
        approveOrganization: (id: string, token: string) => request<void>(`/admin/organizations/${id}/approve`, { method: 'PATCH', token }),
        rejectOrganization: (id: string, reason: string, token: string) =>
            request<void>(`/admin/organizations/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }), token }),
        suspendOrganization: (id: string, reason: string, token: string) =>
            request<void>(`/admin/organizations/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ reason }), token }),
        getAdminStats: (token: string) => request<AdminStats>('/admin/stats', { token }),
        getPlatformAdmins: (token: string, params: { page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc' } = {}) =>
            request<PaginatedResponse<PlatformAdmin>>(`/admin/platform-admins${buildQueryString(params)}`, { token }),
        createPlatformAdmin: (data: Partial<PlatformAdmin> & { password?: string }, token: string) =>
            request<PlatformAdmin>('/admin/platform-admins', { method: 'POST', body: JSON.stringify(data), token }),
        updatePlatformAdmin: (id: string, data: Partial<PlatformAdmin>, token: string) =>
            request<PlatformAdmin>(`/admin/platform-admins/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
        deletePlatformAdmin: (id: string, token: string) => request<void>(`/admin/platform-admins/${id}`, { method: 'DELETE', token }),
    },

    org: {
        getOrgData: (token: string) => request<Organization>('/org/settings', { token }),
        updateSettings: (data: UpdateOrgSettingsRequest, token: string) =>
            request<void>('/org/settings', { method: 'PATCH', body: JSON.stringify(data), token }),
        reapply: (token: string) => request<void>('/org/reapply', { method: 'PATCH', token }),
        getStats: (token: string) => request<OrgStats>('/org/stats', { token }),
        uploadLogo: async (file: File, token: string): Promise<{ logoUrl: string; avatarUpdatedAt: string }> => {
            const formData = new FormData();
            formData.append('file', file);
            // Specifically for uploadLogo we override content-type to let browser set it with boundary
            const response = await fetch(`${API_BASE_URL}/org/settings/logo`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            
            if (response.status === 401 && unauthorizedHandler) {
                unauthorizedHandler();
            }

            if (!response.ok) throw new Error('Failed to upload logo');
            return response.json();
        },
        getTeacher: (id: string, token: string) => request<Teacher>(`/org/teachers/${id}`, { token }),
        getTeachers: (token: string, params: { page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc' } = {}) =>
            request<PaginatedResponse<Teacher>>(`/org/teachers${buildQueryString(params)}`, { token }),
        createTeacher: (data: CreateTeacherRequest, token: string) =>
            request<Teacher>('/org/teachers', { method: 'POST', body: JSON.stringify(data), token }),
        updateTeacher: (id: string, data: UpdateTeacherRequest, token: string) =>
            request<Teacher>(`/org/teachers/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
        deleteTeacher: (id: string, token: string) => request<void>(`/org/teachers/${id}`, { method: 'DELETE', token }),

        getStudent: (id: string, token: string) => request<Student>(`/org/students/${id}`, { token }),
        getStudents: (token: string, params: { page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc', my?: boolean, sectionId?: string } = {}) =>
            request<PaginatedResponse<Student>>(`/org/students${buildQueryString(params)}`, { token }),
        createStudent: (data: CreateStudentRequest, token: string) =>
            request<Student>('/org/students', { method: 'POST', body: JSON.stringify(data), token }),
        updateStudent: (id: string, data: UpdateStudentRequest, token: string) =>
            request<Student>(`/org/students/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
        deleteStudent: (id: string, token: string) => request<void>(`/org/students/${id}`, { method: 'DELETE', token }),

        getSection: (id: string, token: string) => request<Section>(`/org/sections/${id}`, { token }),
        getSections: (token: string, params: { page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc', my?: boolean } = {}) =>
            request<PaginatedResponse<Section>>(`/org/sections${buildQueryString(params)}`, { token }),
        createSection: (data: CreateSectionRequest, token: string) =>
            request<Section>('/org/sections', { method: 'POST', body: JSON.stringify(data), token }),
        updateSection: (id: string, data: UpdateSectionRequest, token: string) =>
            request<Section>(`/org/sections/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
        deleteSection: (id: string, token: string) => request<void>(`/org/sections/${id}`, { method: 'DELETE', token }),

        getCourses: (token: string, params: { page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc', my?: boolean } = {}) =>
            request<PaginatedResponse<Course>>(`/org/courses${buildQueryString(params)}`, { token }),
        createCourse: (data: CreateCourseRequest, token: string) =>
            request<Course>('/org/courses', { method: 'POST', body: JSON.stringify(data), token }),
        updateCourse: (id: string, data: UpdateCourseRequest, token: string) =>
            request<Course>(`/org/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
        deleteCourse: (id: string, token: string) => request<void>(`/org/courses/${id}`, { method: 'DELETE', token }),
        uploadAvatar: async (userId: string, file: File, token: string): Promise<{ avatarUrl: string; avatarUpdatedAt: string }> => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(`${API_BASE_URL}/org/users/${userId}/avatar`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (response.status === 401 && unauthorizedHandler) {
                unauthorizedHandler();
            }

            if (!response.ok) throw new Error('Failed to upload avatar');
            return response.json();
        },

        // --- Assessments ---
        getAssessments: (token: string, params: { sectionId?: string, courseId?: string } = {}) =>
            request<Assessment[]>(`/org/assessments${buildQueryString(params)}`, { token }),
        getAssessment: (id: string, token: string) => request<Assessment>(`/org/assessments/${id}`, { token }),
        createAssessment: (data: CreateAssessmentRequest, token: string) =>
            request<Assessment>('/org/assessments', { method: 'POST', body: JSON.stringify(data), token }),
        updateAssessment: (id: string, data: UpdateAssessmentRequest, token: string) =>
            request<Assessment>(`/org/assessments/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
        deleteAssessment: (id: string, token: string) => request<void>(`/org/assessments/${id}`, { method: 'DELETE', token }),

        // --- Grades ---
        getGrades: (assessmentId: string, token: string) =>
            request<Grade[]>(`/org/assessments/${assessmentId}/grades`, { token }),
        updateGrade: (assessmentId: string, studentId: string, data: UpdateGradeRequest, token: string) =>
            request<Grade>(`/org/grades/${assessmentId}/${studentId}`, { method: 'PATCH', body: JSON.stringify(data), token }),
        getOwnFinalGrades: (token: string) =>
            request<FinalGradeResponse[]>('/org/grades/final', { token }),
        publishGrades: (assessmentId: string, token: string) =>
            request<void>(`/org/assessments/${assessmentId}/publish`, { method: 'PATCH', token }),
        finalizeGrades: (assessmentId: string, token: string) =>
            request<void>(`/org/assessments/${assessmentId}/finalize`, { method: 'PATCH', token }),

        // --- Submissions ---
        getSubmissions: (assessmentId: string, token: string) =>
            request<Submission[]>(`/org/assessments/${assessmentId}/submissions`, { token }),
        createSubmission: (assessmentId: string, data: CreateSubmissionRequest, token: string) =>
            request<Submission>(`/org/assessments/${assessmentId}/submissions`, { method: 'POST', body: JSON.stringify(data), token }),

        // --- Final Results ---
        getStudentFinalGrades: (studentId: string, token: string, sectionId?: string) =>
            request<FinalGradeResponse[]>(`/org/students/${studentId}/final-grades${buildQueryString({ sectionId })}`, { token }),
        getProfile: <T = Student | Teacher>(token: string) =>
            request<T>('/org/profile', { token }),
        updateProfile: <T = Student | Teacher>(data: UpdateStudentRequest | UpdateTeacherRequest, token: string) =>
            request<T>('/org/profile', { method: 'PATCH', body: JSON.stringify(data), token }),
    },

    files: {
        uploadFile: async (orgId: string, entityType: string, entityId: string, file: File, token: string) => {
            const formData = new FormData();
            formData.append('orgId', orgId);
            formData.append('entityType', entityType);
            formData.append('entityId', entityId);
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/files`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (response.status === 401 && unauthorizedHandler) {
                unauthorizedHandler();
            }

            if (!response.ok) {
                let errMessage = 'Failed to upload file';
                try {
                    const err = await response.json();
                    errMessage = Array.isArray(err.message) ? err.message[0] : err.message || errMessage;
                } catch (e) { console.error(e) }
                throw new Error(errMessage || 'Failed to upload file');
            }
            return response.json();
        },
        deleteFile: (id: string, token: string) => request<void>(`/files/${id}`, { method: 'DELETE', token }),
    },

    requests: {
        getRequests: (token: string, params: { page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc', status?: string, category?: string } = {}) =>
            request<PaginatedResponse<RequestItem>>(`/requests${buildQueryString(params)}`, { token }),
        getRequest: (id: string, token: string) =>
            request<RequestDetail>(`/requests/${id}`, { token }),
        createRequest: (data: CreateRequestPayload, token: string) =>
            request<RequestDetail>('/requests', { method: 'POST', body: JSON.stringify(data), token }),
        updateRequest: (id: string, data: UpdateRequestPayload, token: string) =>
            request<RequestDetail>(`/requests/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
        addMessage: async (requestId: string, data: { content: string }, token: string, files?: File[]) => {
            if (files && files.length > 0) {
                const formData = new FormData();
                formData.append('content', data.content);
                files.forEach(file => formData.append('files', file));

                const response = await fetch(`${API_BASE_URL}/requests/${requestId}/messages`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (response.status === 401 && unauthorizedHandler) {
                    unauthorizedHandler();
                }

                if (!response.ok) throw new Error('Failed to send reply with files');
                return response.json();
            }
            return request<RequestDetail>(`/requests/${requestId}/messages`, { method: 'POST', body: JSON.stringify(data), token });
        },
        getContactableUsers: (token: string, search?: string) =>
            request<RequestTarget[]>(`/requests/contacts${buildQueryString({ search })}`, { token }),
        getUnreadCount: (token: string) =>
            request<{ unread: number; total: number; countsByStatus: Record<string, number> }>('/requests/unread-count', { token }),
    },

    chat: {
        searchUsers: (token: string, search?: string) =>
             request<User[]>(`/chat/users${buildQueryString({ search })}`, { token }),
        createDirectChat: (participantId: string, token: string) =>
            request<Chat>('/chat/direct', { method: 'POST', body: JSON.stringify({ participantId }), token }),
        createGroupChat: (name: string, participantIds: string[], token: string) =>
            request<Chat>('/chat/group', { method: 'POST', body: JSON.stringify({ name, participantIds }), token }),
        getUserChats: (token: string) =>
            request<Chat[]>('/chat', { token }),
        getChatMessages: (chatId: string, token: string, params: { page?: number, limit?: number } = {}) =>
            request<PaginatedResponse<ChatMessage>>(`/chat/${chatId}/messages${buildQueryString(params)}`, { token }),
        sendMessage: (chatId: string, content: string, token: string) =>
            request<ChatMessage>(`/chat/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ content }), token }),
        getUnreadCount: (token: string) =>
            request<{ unread: number }>('/chat/unread-count', { token }),
        markAsRead: (chatId: string, messageId: string | undefined, token: string) =>
            request<void>(`/chat/${chatId}/read${messageId ? `/${messageId}` : ''}`, { method: 'PATCH', token }),
        deleteMessage: (chatId: string, messageId: string, token: string) =>
            request<void>(`/chat/${chatId}/messages/${messageId}/delete`, { method: 'POST', token }),
        updateChat: (chatId: string, data: { name?: string, avatarUrl?: string }, token: string) =>
            request<Chat>(`/chat/${chatId}`, { method: 'PATCH', body: JSON.stringify(data), token }),
        addParticipants: (chatId: string, participantIds: string[], token: string) =>
            request<void>(`/chat/${chatId}/participants`, { method: 'POST', body: JSON.stringify({ participantIds }), token }),
        removeParticipant: (chatId: string, userId: string, token: string) =>
            request<void>(`/chat/${chatId}/participants/${userId}/remove`, { method: 'POST', token }),
    },

    notifications: {
        getUserNotifications: (token: string, params: { page?: number, limit?: number } = {}) =>
            request<PaginatedResponse<Notification> & { unreadCount: number }>(`/notifications${buildQueryString(params)}`, { token }),
        markAsRead: (id: string, token: string) =>
            request<void>(`/notifications/${id}/read`, { method: 'PATCH', token }),
        markAllAsRead: (token: string) =>
            request<void>('/notifications/read-all', { method: 'PATCH', token }),
    },

    announcements: {
        createAnnouncement: (data: { title: string, body: string, targetType: TargetType, targetId?: string, actionUrl?: string, priority?: AnnouncementPriority }, token: string) =>
            request<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(data), token }),
        getAnnouncements: (token: string, params: { page?: number, limit?: number } = {}) =>
            request<PaginatedResponse<Announcement>>(`/announcements${buildQueryString(params)}`, { token }),
    }
};
