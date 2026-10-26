// Rate limiter. On Vercel the counters live in the database (instances do not share memory); elsewhere in memory.
import { remote } from './backend';
import { K, pipe, cmd } from './remote-core';

const hits = (globalThis.__maggamLimits ||= new Map()); // shared by every route

function memoryAllow(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return false; }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

export async function allow(key, max, windowMs) {
  const R = remote();
  if (R) {
    try {
      const [n, ttl] = await pipe(R, [['INCR', K.limit(key)], ['TTL', K.limit(key)]]);
      if (Number(ttl) < 0) await cmd(R, 'EXPIRE', K.limit(key), Math.ceil(windowMs / 1000));
      return Number(n) <= max;
    } catch { /* database unreachable: fall back to this instance's memory */ }
  }
  return memoryAllow(key, max, windowMs);
}

export const clientIp = (request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
