export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    orgSlug: string | null;
    orgId: string | null;
    approved: boolean;
    isFirstLogin: boolean;
}
