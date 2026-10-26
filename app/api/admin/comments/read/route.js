import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin, deny } from '@/lib/auth';
import { markRead } from '@/lib/store';

export async function POST(request) {
  if (!sameOrigin(request)) return deny(403, 'Cross-site request blocked');
  if (!(await isAdmin())) return deny();
  const p = await request.json().catch(() => ({}));
  const ids = p.all ? 'all' : (Array.isArray(p.ids) ? p.ids.map(String) : []);
  const n = await markRead(ids);
  return NextResponse.json({ ok: true, marked: n });
}
