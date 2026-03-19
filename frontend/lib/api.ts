import {
    Teacher, Student, Organization, RegisterRequest, LoginRequest, AuthResponse,
    UpdateOrgSettingsRequest, PlatformAdmin, AdminStats, OrgStats, SupportTicket, Section, Course,
    CreateTeacherRequest, UpdateTeacherRequest, CreateStudentRequest, UpdateStudentRequest,
    CreateSectionRequest, UpdateSectionRequest, CreateCourseRequest, UpdateCourseRequest,
    PaginatedResponse, OrgStatus,
    Assessment, Grade, Submission, CreateAssessmentRequest, UpdateAssessmentRequest,
    UpdateGradeRequest, CreateSubmissionRequest, FinalGradeResponse
} from '@/types';


export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

interface RequestOptions extends RequestInit {
    token?: string;
}

interface QueryParams {
    [key: string]: string | number | boolean | undefined;
}

function buildQueryString(params: QueryParams): string {
    const query = Object.entries(params)
        .filter(([value]) => value !== undefined && value !== '')
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
            // Ignore parsing errors for the error message itself
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
        getSupportTickets: (token: string, params: { page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc' } = {}) =>
            request<PaginatedResponse<SupportTicket>>(`/admin/support${buildQueryString(params)}`, { token }),
        resolveSupportTicket: (id: string, token: string) => request<void>(`/admin/support/${id}/resolve`, { method: 'PATCH', token }),
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
        submitSupportTicket: (topic: string, message: string, token: string) =>
            request<void>('/org/support', { method: 'POST', body: JSON.stringify({ topic, message }), token }),
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
        getProfile: (token: string) =>
            request<any>('/org/profile', { token }),
        updateProfile: (data: any, token: string) =>
            request<any>('/org/profile', { method: 'PATCH', body: JSON.stringify(data), token }),
    }
};
