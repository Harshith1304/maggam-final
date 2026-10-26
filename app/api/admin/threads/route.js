import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin, deny } from '@/lib/auth';
import { saveThread, getRawThread, getThreadsFresh } from '@/lib/threads';

export async function GET(request) {
  if (!(await isAdmin())) return deny();
  const slug = new URL(request.url).searchParams.get('slug') || '';
  if (!/^[a-z0-9-]+$/.test(slug)) return deny(400, 'Bad slug');
  const raw = await getRawThread(slug);
  return raw ? NextResponse.json({ ok: true, thread: raw }) : deny(404, 'Not found');
}

export async function POST(request) {
  if (!sameOrigin(request)) return deny(403, 'Cross-site request blocked');
  if (!(await isAdmin())) return deny();
  const p = await request.json().catch(() => null);
  if (!p) return deny(400, 'Bad request');
  try {
    const out = await saveThread(p);
    return NextResponse.json({ ok: true, ...out, total: (await getThreadsFresh()).length });
  } catch (e) {
    return deny(400, e.message);
  }
}
