export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  designation?: string;
  type?: string;
  status?: string;
  isFirstLogin?: boolean;
}
