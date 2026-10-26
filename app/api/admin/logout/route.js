import { NextResponse } from 'next/server';
import { clearSession, sameOrigin, deny } from '@/lib/auth';

export async function POST(request) {
  if (!sameOrigin(request)) return deny(403, 'Cross-site request blocked');
  const res = NextResponse.json({ ok: true });
  clearSession(res);
  return res;
}
