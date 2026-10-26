// Downloads everything from the live database to this computer: a backup, and a way to keep your local copy in step.
//   threads -> content/threads,   comments -> data/comments.json,   themes -> data/themes.json,   photos -> data/uploads
//
//   npm run pull              download everything
//   npm run pull -- --dry     only show what would be downloaded
//
// A local file that differs from the live one is kept as <name>.bak-<time> before it is replaced. Nothing is ever deleted.
import fs from 'node:fs';
import path from 'node:path';
import { remoteConfig, K, cmd, toObject, getImage } from '../lib/remote-core.js';

const DRY = process.argv.includes('--dry');
const root = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

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
  console.error('I could not find the database address. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your .env.local (see the README).');
  process.exit(1);
}
try { await cmd(cfg, 'PING'); } catch (e) { console.error('Could not reach the database: ' + e.message); process.exit(1); }
console.log(`\nConnected to the database.${DRY ? '  (dry run: nothing will be written)' : ''}\n`);

const norm = (t) => t.replace(/\r\n?/g, '\n');
function writeKeeping(file, text) {
  if (fs.existsSync(file) && norm(fs.readFileSync(file, 'utf8')) !== norm(text)) {
    if (!DRY) fs.copyFileSync(file, `${file}.bak-${stamp}`);
    return 'updated';
  }
  if (fs.existsSync(file)) return 'same';
  return 'new';
}

// threads
{
  const dir = path.join(root, 'content', 'threads');
  const live = toObject(await cmd(cfg, 'HGETALL', K.threads));
  const count = { new: 0, updated: 0, same: 0 };
  if (!DRY) fs.mkdirSync(dir, { recursive: true });
  for (const [name, text] of Object.entries(live)) {
    if (!/^[\w.-]+\.md$/.test(name)) continue;
    const file = path.join(dir, name);
    const state = writeKeeping(file, text);
    count[state]++;
    if (!DRY && state !== 'same') fs.writeFileSync(file, text, 'utf8');
  }
  console.log(`Threads:   ${count.new} new, ${count.updated} updated (old copy kept as .bak), ${count.same} unchanged`);
}

// comments
{
  const raw = toObject(await cmd(cfg, 'HGETALL', K.comments));
  const comments = Object.values(raw).map((v) => { try { return JSON.parse(v); } catch { return null; } }).filter(Boolean);
  const file = path.join(root, 'data', 'comments.json');
  const text = JSON.stringify({ comments }, null, 1);
  const state = writeKeeping(file, text);
  if (!DRY && state !== 'same') { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text, 'utf8'); }
  console.log(`Comments:  ${comments.length} (${state === 'same' ? 'unchanged' : state === 'new' ? 'saved' : 'saved, old file kept as .bak'})`);
}

// themes
{
  let themes = [];
  try { themes = JSON.parse((await cmd(cfg, 'GET', K.themes)) || '{}').themes || []; } catch {}
  const file = path.join(root, 'data', 'themes.json');
  const text = JSON.stringify({ themes }, null, 1);
  const state = writeKeeping(file, text);
  if (!DRY && state !== 'same') { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text, 'utf8'); }
  console.log(`Themes:    ${themes.length} (${state === 'same' ? 'unchanged' : state === 'new' ? 'saved' : 'saved, old file kept as .bak'})`);
}

// photos
{
  const dir = path.join(root, 'data', 'uploads');
  const meta = toObject(await cmd(cfg, 'HGETALL', K.media));
  const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
  let got = 0, had = 0;
  for (const [id, js] of Object.entries(meta)) {
    let type = 'image/png';
    try { type = JSON.parse(js).type; } catch {}
    const file = path.join(dir, `${id}.${EXT[type] || 'png'}`);
    if (fs.existsSync(file)) { had++; continue; }
    if (!DRY) {
      const img = await getImage(cfg, id);
      if (!img) continue;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, img.buffer);
    }
    got++;
  }
  console.log(`Photos:    ${got} downloaded, ${had} already here`);
}
console.log(DRY ? '\nDry run finished. Nothing was changed.\n' : '\nDone. Your local folder now matches the live site.\n');
