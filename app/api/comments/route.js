import { NextResponse } from 'next/server';
import { getThread } from '@/lib/threads';
import { listForThread, addComment } from '@/lib/store';
import { isAdmin, sameOrigin, deny, visitorId, setVisitor } from '@/lib/auth';
import { allow, clientIp } from '@/lib/limit';

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);

export async function GET(request) {
  const slug = new URL(request.url).searchParams.get('slug') || '';
  if (!/^[a-z0-9-]+$/.test(slug) || !(await getThread(slug))) return deny(404, 'Unknown thread');
  const { vid } = await visitorId();
  const comments = await listForThread(slug, vid);
  return NextResponse.json({ ok: true, comments, isAdmin: await isAdmin() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (!sameOrigin(request)) return deny(403, 'Cross-site request blocked');
  let p;
  try { p = await request.json(); } catch { return deny(400, 'Bad request'); }

  if (p.website) return NextResponse.json({ ok: true, comment: null }); // honeypot: bots fill hidden fields, people never see them

  const slug = String(p.slug || '');
  if (!/^[a-z0-9-]+$/.test(slug) || !(await getThread(slug))) return deny(404, 'Unknown thread');

  const admin = await isAdmin();
  if (!admin && !(await allow('c:' + clientIp(request), 5, 10 * 60 * 1000))) return deny(429, 'Easy there. Please wait a few minutes before commenting again.');

  const name = admin ? 'Harshith' : clean(p.name, 40);
  const message = clean(p.message, 1000);
  if (!name) return deny(400, 'Please add your name.');
  if (message.length < 2) return deny(400, 'Write a few words first.');
  if (!admin && /harshith/i.test(name)) return deny(400, 'That name belongs to the author. Please pick another.');
  if ((message.match(/https?:\/\//gi) || []).length > 2) return deny(400, 'Too many links in one comment.');

  const { vid, fresh } = await visitorId();
  try {
    const comment = await addComment({ slug, name, message, parentId: p.parentId ? String(p.parentId) : null, vid, author: admin });
    const res = NextResponse.json({ ok: true, comment });
    if (fresh) setVisitor(res, vid);
    return res;
  } catch (e) {
    return deny(400, e.message);
  }
}
