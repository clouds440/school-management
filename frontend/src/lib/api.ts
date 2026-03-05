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
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
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
    createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            return response.json();
        },
    },
    admin: {
        async getPendingOrganizations(token: string): Promise<Organization[]> {
            const response = await fetch(`${API_BASE_URL}/admin/organizations/pending`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch pending organizations');
            return response.json();
        },
        async approveOrganization(id: string, token: string): Promise<void> {
            const response = await fetch(`${API_BASE_URL}/admin/organizations/${id}/approve`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to approve organization');
        },
        async rejectOrganization(id: string, token: string): Promise<void> {
            const response = await fetch(`${API_BASE_URL}/admin/organizations/${id}/reject`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to reject organization');
        }
    }
};
