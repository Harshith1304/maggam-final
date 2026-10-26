import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE = 'mg_admin';
const VID = 'mg_vid';
const DAYS = 14;
const secret = () => process.env.SESSION_SECRET || '';

export const adminConfigured = () => !!process.env.ADMIN_PASSWORD && secret().length >= 16;

const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('hex');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();

export function passwordOk(input) {
  if (!adminConfigured()) return false;
  return crypto.timingSafeEqual(sha(input), sha(process.env.ADMIN_PASSWORD));
}

export function sessionValue() {
  const exp = String(Date.now() + DAYS * 86400000);
  return `${exp}.${sign(exp)}`;
}

export function setSession(res) {
  res.cookies.set(COOKIE, sessionValue(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 });
}
export function clearSession(res) {
  res.cookies.set(COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

function valid(v) {
  if (!v || !adminConfigured()) return false;
  const [exp, sig] = v.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

/** True only for the owner's signed-in browser. */
export async function isAdmin() {
  return valid((await cookies()).get(COOKIE)?.value);
}

/** Every state-changing request must come from this same site. */
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === request.headers.get('host'); } catch { return false; }
}

export const deny = (status = 401, error = 'Not allowed') => NextResponse.json({ ok: false, error }, { status });

/** Anonymous but stable visitor id, so a like can be taken back and counted only once. */
export async function visitorId() {
  const jar = await cookies();
  const existing = jar.get(VID)?.value;
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return { vid: existing, fresh: false };
  return { vid: crypto.randomBytes(16).toString('hex'), fresh: true };
}
export function setVisitor(res, vid) {
  res.cookies.set(VID, vid, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 400 * 86400 });
}
