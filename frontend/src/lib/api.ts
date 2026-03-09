export enum OrganizationType {
    HIGH_SCHOOL = 'HIGH_SCHOOL',
    UNIVERSITY = 'UNIVERSITY',
    PRIMARY_SCHOOL = 'PRIMARY_SCHOOL',
    OTHER = 'OTHER',
}

export interface RegisterRequest {
    name: string;
    location: string;
    type: OrganizationType;
    email: string;
    contactEmail?: string;
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
}

export interface Organization {
    id: string;
    name: string;
    location: string;
    type: string;
    email: string;
    status: string;
    statusMessage?: string;
    createdAt: string;
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

export interface SupportTicket {
    id: string;
    organizationId: string;
    organization?: Organization;
    topic: string;
    message: string;
    isResolved: boolean;
    createdAt: string;
}


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

/**
 * Robust error handler for backend responses
 */
async function handleError(response: Response, defaultMessage: string): Promise<never> {
    let message = defaultMessage;
    try {
        const data = await response.json();
        if (data.message) {
            // NestJS validation errors are often arrays
            message = Array.isArray(data.message) ? data.message[0] : data.message;
        }
    } catch (e) {
        // Fallback to text if JSON parsing fails
        try {
            const text = await response.text();
            if (text) message = text;
        } catch (e2) {
            // Stick with default message
        }
    }
    throw new Error(message);
}

export const api = {

    auth: {
        async register(data: RegisterRequest): Promise<AuthResponse> {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) await handleError(response, 'Registration failed');
            return response.json();
        },


        async login(data: LoginRequest): Promise<AuthResponse> {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) await handleError(response, 'Login failed');
            return response.json();
        },

        async changePassword(oldPassword: string, newPassword: string, token: string): Promise<{ access_token: string, role: string }> {
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to change password');
            }
            return response.json();
        }
    },
    admin: {
        async getOrganizations(token: string, status?: string): Promise<Organization[]> {
            const url = status
                ? `${API_BASE_URL}/admin/organizations?status=${status}`
                : `${API_BASE_URL}/admin/organizations`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) await handleError(response, 'Failed to fetch organizations');
            return response.json();
        },



        async approveOrganization(id: string, token: string): Promise<void> {
            const response = await fetch(`${API_BASE_URL}/admin/organizations/${id}/approve`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) await handleError(response, 'Failed to approve organization');
        },


        async rejectOrganization(id: string, reason: string, token: string): Promise<void> {
            const response = await fetch(`${API_BASE_URL}/admin/organizations/${id}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });
            if (!response.ok) await handleError(response, 'Failed to reject organization');
        },


        async suspendOrganization(id: string, reason: string, token: string): Promise<void> {
            const response = await fetch(`${API_BASE_URL}/admin/organizations/${id}/suspend`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });
            if (!response.ok) await handleError(response, 'Failed to suspend organization');
        },



        async getSupportTickets(token: string): Promise<SupportTicket[]> {
            const response = await fetch(`${API_BASE_URL}/admin/support`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) await handleError(response, 'Failed to fetch support tickets');
            return response.json();
        },



        async resolveSupportTicket(id: string, token: string): Promise<void> {
            const response = await fetch(`${API_BASE_URL}/admin/support/${id}/resolve`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) await handleError(response, 'Failed to resolve support ticket');
        },



        async getAdminStats(token: string): Promise<AdminStats> {
            const response = await fetch(`${API_BASE_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) await handleError(response, 'Failed to fetch admin stats');
            return response.json();
        },



        async changePassword(oldPassword: string, newPassword: string, token: string): Promise<{ access_token: string, role: string }> {

            const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to change password');
            }
            return response.json();
        },

        async getPlatformAdmins(token: string): Promise<PlatformAdmin[]> {
            const response = await fetch(`${API_BASE_URL}/admin/platform-admins`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) await handleError(response, 'Failed to fetch platform admins');
            return response.json();
        },

        async createPlatformAdmin(data: Partial<PlatformAdmin> & { password?: string }, token: string): Promise<PlatformAdmin> {
            const response = await fetch(`${API_BASE_URL}/admin/platform-admins`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) await handleError(response, 'Failed to create platform admin');
            return response.json();
        },

        async updatePlatformAdmin(id: string, data: Partial<PlatformAdmin>, token: string): Promise<PlatformAdmin> {
            const response = await fetch(`${API_BASE_URL}/admin/platform-admins/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) await handleError(response, 'Failed to update platform admin');
            return response.json();
        },

        async deletePlatformAdmin(id: string, token: string): Promise<void> {
            const response = await fetch(`${API_BASE_URL}/admin/platform-admins/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) await handleError(response, 'Failed to delete platform admin');
        }
    },

    org: {
        async reapply(token: string): Promise<void> {
            const response = await fetch(`${API_BASE_URL}/org/reapply`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) await handleError(response, 'Failed to re-apply');
        },


        async submitSupportTicket(topic: string, message: string, token: string): Promise<void> {
            const response = await fetch(`${API_BASE_URL}/org/support`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ topic, message })
            });

            if (!response.ok) await handleError(response, 'Failed to submit support ticket');
        }

    }
};
