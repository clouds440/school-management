import { redirect } from 'next/navigation';

export default function AdminDashboardIndex() {
    redirect('/admin/dashboard/organizations');
}
