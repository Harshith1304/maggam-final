import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { unreadCount } from '@/lib/store';

export async function GET() {
  const admin = await isAdmin();
  return NextResponse.json({ admin, unread: admin ? await unreadCount() : 0 }, { headers: { 'Cache-Control': 'no-store' } });
}
