export interface RequestUser {
    id: string;
    role: string;
    organizationId: string | null;
    name: string | null;
}
