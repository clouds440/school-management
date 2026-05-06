'use client';

import { MailPage } from '@/components/mail/MailPage';

export default function AdminMailPage() {
    return <MailPage localStorageKey="edu-admin-mail-limit" />;
}