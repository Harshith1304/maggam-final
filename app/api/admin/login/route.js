import { NextResponse } from 'next/server';
import { adminConfigured, passwordOk, setSession, sameOrigin, deny } from '@/lib/auth';
import { allow, clientIp } from '@/lib/limit';

export async function POST(request) {
  if (!sameOrigin(request)) return deny(403, 'Cross-site request blocked');
  if (!adminConfigured()) return deny(503, 'Studio is not set up yet. Add ADMIN_PASSWORD and SESSION_SECRET to .env.local.');
  if (!(await allow('a:' + clientIp(request), 8, 15 * 60 * 1000))) return deny(429, 'Too many attempts. Try again in a few minutes.');
  let p;
  try { p = await request.json(); } catch { return deny(400, 'Bad request'); }
  if (!passwordOk(String(p.password || ''))) return deny(401, 'That is not the password.');
  const res = NextResponse.json({ ok: true });
  setSession(res);
  return res;
}
