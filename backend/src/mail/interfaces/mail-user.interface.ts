export interface MailUser {
  id: string;
  role: string;
  organizationId: string | null;
  name: string | null;
  email: string;
}
