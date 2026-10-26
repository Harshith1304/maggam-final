import { NextResponse } from 'next/server';
import { toggleLike } from '@/lib/store';
import { sameOrigin, deny, visitorId, setVisitor } from '@/lib/auth';
import { allow, clientIp } from '@/lib/limit';

export async function POST(request) {
  if (!sameOrigin(request)) return deny(403, 'Cross-site request blocked');
  if (!(await allow('l:' + clientIp(request), 60, 10 * 60 * 1000))) return deny(429, 'Slow down a little.');
  let p;
  try { p = await request.json(); } catch { return deny(400, 'Bad request'); }
  const { vid, fresh } = await visitorId();
  try {
    const out = await toggleLike(String(p.id || ''), vid);
    const res = NextResponse.json({ ok: true, ...out });
    if (fresh) setVisitor(res, vid);
    return res;
  } catch (e) {
    return deny(404, e.message);
  }
}
