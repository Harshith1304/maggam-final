// Decides where data lives.
//  - On Vercel (or with MAGGAM_STORAGE=remote) and with Upstash credentials: a small Redis database.
//  - Anywhere else (your PC, your own server): plain files, exactly as before.
import fs from 'node:fs';
import path from 'node:path';
import { remoteConfig, K, pipe, cmd, toObject } from './remote-core';

/** The database connection, or null when files are used. */
export function remote() {
  const cfg = remoteConfig();
  if (!cfg) return null;
  return process.env.VERCEL || process.env.MAGGAM_STORAGE === 'remote' ? cfg : null;
}
export const isRemote = () => !!remote();

export const NO_DATABASE = 'The database is not connected to this Vercel project yet. In Vercel open the project, go to Storage, connect an Upstash Redis database, then redeploy.';

/** Where the site is storing things right now (shown at /api/status and in the Studio). */
export function storageStatus() {
  const onVercel = !!process.env.VERCEL;
  const R = remote();
  return { storage: R ? 'database' : 'files', onVercel, missingDatabase: onVercel && !R };
}

/** Vercel cannot write files, so without a database a save would fail with a confusing file error. */
export function assertWritable() {
  if (process.env.VERCEL && !remote()) throw new Error(NO_DATABASE);
}

// Reading from a database on every request would waste its free quota, so one snapshot of threads, themes
// and photo ids is kept in memory for a few seconds. Every change raises a version number in the database;
// when the snapshot expires, one cheap command checks that number, and only a changed number triggers a
// full re-read. The state lives on globalThis because each page and API route is bundled separately and
// would otherwise keep its own private copy.
const TTL = 10000;
const S = (globalThis.__maggamBackend ||= { snap: null, inflight: null, seedTried: false });

/** Call after any write: forget the snapshot here and raise the version for every other server instance. */
export async function invalidate() {
  S.snap = null;
  const R = remote();
  if (R) { try { await cmd(R, 'INCR', K.version); } catch { /* the 10 second expiry still catches up */ } }
}

const parseThemes = (s) => { try { return JSON.parse(s || '{}').themes || []; } catch { return []; } };

// First start on a new database: bring in the threads that ship with the site (content/threads), once.
async function seedFromBundle(R) {
  const dir = path.join(process.cwd(), 'content', 'threads');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  for (let i = 0; i < files.length; i += 8) {
    await pipe(R, files.slice(i, i + 8).map((f) => ['HSET', K.threads, f, fs.readFileSync(path.join(dir, f), 'utf8')]));
  }
}

async function load(R) {
  const [threads, themes, media, ver] = await pipe(R, [['HGETALL', K.threads], ['GET', K.themes], ['HKEYS', K.media], ['GET', K.version]]);
  let t = toObject(threads);
  if (!Object.keys(t).length && !S.seedTried) {
    S.seedTried = true;
    await seedFromBundle(R);
    t = toObject(await cmd(R, 'HGETALL', K.threads));
  }
  return { at: Date.now(), ver: ver ?? '0', threads: t, themes: parseThemes(themes), media: new Set(media || []) };
}

export async function snapshot(fresh = false) {
  const R = remote();
  if (!R) throw new Error('Remote storage is not active');
  if (!fresh && S.snap && Date.now() - S.snap.at < TTL) return S.snap;
  if (S.inflight) return S.inflight;
  S.inflight = (async () => {
    if (!fresh && S.snap) {
      // expired: has anything changed anywhere? one command answers it
      try {
        const ver = (await cmd(R, 'GET', K.version)) ?? '0';
        if (ver === S.snap.ver) { S.snap.at = Date.now(); return S.snap; }
      } catch { return S.snap; } // database unreachable: keep showing the last good copy
    }
    try {
      S.snap = await load(R);
      return S.snap;
    } catch (e) {
      if (S.snap) return S.snap;
      throw e;
    }
  })().finally(() => { S.inflight = null; });
  return S.inflight;
}
