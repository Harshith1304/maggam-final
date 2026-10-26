// Copies your local work into the database that the Vercel version uses:
//   your threads, your own themes, comments and likes, and uploaded cover photos.
//
//   npm run push               copy what is missing
//   npm run push -- --dry      only show what would be copied
//   npm run push -- --overwrite-threads   also replace threads that differ (default: keep the online copy)
//
// Safe to run again: nothing is added twice, and nothing already online is replaced unless you ask.
import fs from 'node:fs';
import path from 'node:path';
import { remoteConfig, K, cmd, pipe, toObject, putImage } from '../lib/remote-core.js';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const OVERWRITE = args.includes('--overwrite-threads');
const root = process.cwd();

// read .env.local without any extra package
const env = { ...process.env };
const envFile = path.join(root, '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const cfg = remoteConfig(env);
if (!cfg) {
  console.error(`
I could not find the database address.
Add these two lines to your .env.local (copy the values from your Vercel project > Storage > your Upstash database):

  UPSTASH_REDIS_REST_URL=https://....upstash.io
  UPSTASH_REDIS_REST_TOKEN=....

(If Vercel shows KV_REST_API_URL and KV_REST_API_TOKEN instead, those work too.)
`);
  process.exit(1);
}

let changed = false; // did this run write anything?
const log = (s) => console.log(s);
const TYPES = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

try {
  const pong = await cmd(cfg, 'PING');
  if (String(pong).toUpperCase() !== 'PONG') throw new Error('unexpected answer');
} catch (e) {
  console.error('Could not reach the database: ' + e.message + '\nCheck the address and token in .env.local.');
  process.exit(1);
}
log(`\nConnected to the database.${DRY ? '  (dry run: nothing will be written)' : ''}\n`);

/* ---- threads ---- */
{
  const dir = path.join(root, 'content', 'threads');
  const local = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : [];
  const remote = toObject(await cmd(cfg, 'HGETALL', K.threads));
  const norm = (t) => t.replace(/\r\n?/g, '\n');
  let added = 0, same = 0, replaced = 0;
  const differs = [];
  const writes = [];
  for (const f of local) {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    if (!(f in remote)) { added++; writes.push(['HSET', K.threads, f, text]); }
    else if (norm(remote[f]) === norm(text)) same++;
    else if (OVERWRITE) { replaced++; writes.push(['HSET', K.threads, f, text]); }
    else differs.push(f);
  }
  if (!DRY) for (let i = 0; i < writes.length; i += 8) await pipe(cfg, writes.slice(i, i + 8));
  if (writes.length) changed = true;
  log(`Threads:   ${added} added, ${same} already there, ${replaced} replaced` + (differs.length ? `, ${differs.length} kept as online (they differ here)` : ''));
  if (differs.length) {
    log('           online copy kept for: ' + differs.join(', '));
    log('           (to replace them with the versions on this computer, run: npm run push -- --overwrite-threads)');
  }
}

/* ---- your own themes ---- */
{
  const file = path.join(root, 'data', 'themes.json');
  let localThemes = [];
  if (fs.existsSync(file)) { try { localThemes = JSON.parse(fs.readFileSync(file, 'utf8')).themes || []; } catch {} }
  let remoteThemes = [];
  try { remoteThemes = JSON.parse((await cmd(cfg, 'GET', K.themes)) || '{}').themes || []; } catch {}
  const ids = new Set(remoteThemes.map((t) => t.id));
  const names = new Set(remoteThemes.map((t) => String(t.name).toLowerCase()));
  const merged = remoteThemes.slice();
  let added = 0, skipped = 0;
  for (const t of localThemes) {
    if (ids.has(t.id)) continue;
    if (names.has(String(t.name).toLowerCase())) { skipped++; continue; }
    merged.push(t); added++;
  }
  if (!DRY && added) await cmd(cfg, 'SET', K.themes, JSON.stringify({ themes: merged }));
  if (added) changed = true;
  log(`Themes:    ${added} added, ${localThemes.length - added - skipped} already there` + (skipped ? `, ${skipped} skipped (same name, different theme)` : ''));
}

/* ---- comments and likes ---- */
{
  const file = path.join(root, 'data', 'comments.json');
  let local = [];
  if (fs.existsSync(file)) { try { local = JSON.parse(fs.readFileSync(file, 'utf8')).comments || []; } catch {} }
  const remoteIds = new Set(Object.keys(toObject(await cmd(cfg, 'HGETALL', K.comments))));
  const fresh = local.filter((c) => c && c.id && !remoteIds.has(c.id));
  if (!DRY) for (let i = 0; i < fresh.length; i += 20) await pipe(cfg, fresh.slice(i, i + 20).map((c) => ['HSET', K.comments, c.id, JSON.stringify(c)]));
  if (fresh.length) changed = true;
  log(`Comments:  ${fresh.length} added, ${local.length - fresh.length} already there`);
}

/* ---- cover photos ---- */
{
  const dir = path.join(root, 'data', 'uploads');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^[a-f0-9]{24}\.(png|jpg|webp|gif)$/.test(f)) : [];
  const have = new Set((await cmd(cfg, 'HKEYS', K.media)) || []);
  let added = 0, big = 0;
  for (const f of files) {
    const [id, ext] = f.split('.');
    if (have.has(id)) continue;
    const buf = fs.readFileSync(path.join(dir, f));
    if (buf.length > 4 * 1024 * 1024) big++;
    if (!DRY) await putImage(cfg, id, buf, TYPES[ext]);
    added++;
    changed = true;
  }
  log(`Photos:    ${added} added, ${files.length - added} already there`);
  if (big) log(`           note: ${big} photo(s) are over 4 MB; Vercel cannot send files that large, so shrink them and upload again from the Studio.`);
}

// The live site keeps a short-lived copy of the data. Raising this number tells every running copy to re-read it,
// so what you just pushed appears within a few seconds instead of whenever the site next restarts.
if (!DRY && changed) { await cmd(cfg, 'INCR', K.version); log('\nTold the live site to refresh.'); }

log(DRY ? '\nDry run finished. Nothing was changed.\n' : '\nDone. Open your site and the Studio to check (it can take about 10 seconds to show).\n');
