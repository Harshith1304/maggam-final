import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin, deny } from '@/lib/auth';
import { deleteComment } from '@/lib/store';

export async function POST(request) {
  if (!sameOrigin(request)) return deny(403, 'Cross-site request blocked');
  if (!(await isAdmin())) return deny();
  const p = await request.json().catch(() => ({}));
  const removed = await deleteComment(String(p.id || ''));
  return NextResponse.json({ ok: true, removed });
}
