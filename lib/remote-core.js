// Talks to Upstash Redis over plain HTTPS (its REST API). No dependencies and no imports,
// so the website and the copy script (scripts/push-remote.mjs) share exactly the same code.

/** The Redis address and token. Vercel's Upstash integration provides them under KV_REST_API_URL / KV_REST_API_TOKEN
 *  (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN), and lets you choose your own prefix instead of KV
 *  (for example STORAGE_REST_API_URL), so any matching pair is accepted. The read-only token is never used. */
export function remoteConfig(env = process.env) {
  const pair = (url, token) => (url && token ? { url: String(url).replace(/\/+$/, ''), token } : null);
  const direct = pair(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN) || pair(env.KV_REST_API_URL, env.KV_REST_API_TOKEN);
  if (direct) return direct;
  for (const key of Object.keys(env)) {
    const m = /^(.*)_REST_API_URL$/.exec(key) || /^(.*)_REDIS_REST_URL$/.exec(key);
    if (!m || !env[key]) continue;
    const found = pair(env[key], env[`${m[1]}_REST_API_TOKEN`] || env[`${m[1]}_REDIS_REST_TOKEN`]);
    if (found) return found;
  }
  return null;
}

// Where each kind of data lives in the database.
export const K = {
  threads: 'maggam:threads',          // hash: file name -> the thread's markdown text
  themes: 'maggam:themes',            // string: JSON {themes:[...]}
  comments: 'maggam:comments',        // hash: comment id -> JSON
  media: 'maggam:media',              // hash: photo id -> JSON {type,size,chunks}
  chunk: (id, n) => `maggam:media:${id}:${n}`,
  limit: (k) => `maggam:rl:${k}`,
  version: 'maggam:ver',              // string: a counter that goes up with every change
};

async function post(cfg, path, body) {
  let res;
  try {
    res = await fetch(cfg.url + path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new Error('The storage service could not be reached. Please try again in a moment.');
  }
  let json;
  try { json = await res.json(); } catch { throw new Error(`Storage answered ${res.status} without data`); }
  if (!res.ok) throw new Error((json && json.error) || `Storage error ${res.status}`);
  return json;
}

/** One command, e.g. cmd(cfg, 'HSET', 'key', 'field', 'value'). */
export async function cmd(cfg, ...args) {
  const j = await post(cfg, '', args.map(String));
  if (j.error) throw new Error(j.error);
  return j.result;
}

/** Several commands in one round trip. Returns the results in order. */
export async function pipe(cfg, commands) {
  const arr = await post(cfg, '/pipeline', commands.map((c) => c.map(String)));
  return arr.map((r) => { if (r && r.error) throw new Error(r.error); return r ? r.result : null; });
}

/** Redis returns a hash as [field, value, field, value ...]; make it an object. */
export function toObject(r) {
  if (!r) return {};
  if (Array.isArray(r)) { const o = {}; for (let i = 0; i + 1 < r.length; i += 2) o[r[i]] = r[i + 1]; return o; }
  return r;
}

// Photos are stored as base64 text in pieces, so no single request is larger than the free plan allows.
export const CHUNK = 500000;

export async function putImage(cfg, id, buffer, type) {
  const b64 = Buffer.from(buffer).toString('base64');
  const n = Math.ceil(b64.length / CHUNK);
  for (let i = 0; i < n; i++) await cmd(cfg, 'SET', K.chunk(id, i), b64.slice(i * CHUNK, (i + 1) * CHUNK));
  await cmd(cfg, 'HSET', K.media, id, JSON.stringify({ type, size: buffer.length, chunks: n, at: Date.now() }));
}

export async function getImage(cfg, id) {
  const meta = await cmd(cfg, 'HGET', K.media, id);
  if (!meta) return null;
  const m = JSON.parse(meta);
  const parts = await pipe(cfg, Array.from({ length: m.chunks }, (_, i) => ['GET', K.chunk(id, i)]));
  if (parts.some((p) => p == null)) return null;
  return { buffer: Buffer.from(parts.join(''), 'base64'), type: m.type };
}
