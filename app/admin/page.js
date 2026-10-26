import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import Studio from '@/components/Studio';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Studio', robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/login/');
  return <Studio />;
}
