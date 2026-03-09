export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    orgSlug: string | null;
    designation?: string;
    type?: string;
    status?: string;
    isFirstLogin?: boolean;

}
