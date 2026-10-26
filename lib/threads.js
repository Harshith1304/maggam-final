import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { parseFrontmatter } from './frontmatter';
import { dyeOf, dyeKeyForHex, CATEGORIES } from './dyes';
import { listThemes, getTheme, HEX } from './themes';
import { MOTIFS } from './art';
import { parseBlocks, excerptOf, blocksFromInput, slugify, stripSizeTokens, SIZES } from './text';
import { listImageIds } from './media';
import { remote, snapshot, invalidate, assertWritable } from './backend';
import { cmd, K } from './remote-core';

export { formatDate } from './text';

// Threads are markdown files in content/threads on your own computer or server,
// and entries in the database on Vercel. Everything below works the same for both.
const DIR = process.env.CONTENT_DIR ? path.resolve(process.env.CONTENT_DIR) : path.join(process.cwd(), 'content', 'threads');

const clamp = (n, lo, hi, d) => { n = Number(n); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n * 10) / 10)) : d; };
/** Cover picture settings: an uploaded photo (optional) plus how it is framed. */
function coverOf(data, imageIds) {
  const id = typeof data.cover === 'string' && imageIds.has(data.cover) ? data.cover : null;
  return { id, src: id ? `/media/${id}/` : null, x: clamp(data.coverX, 0, 100, 50), y: clamp(data.coverY, 0, 100, 50), zoom: clamp(data.coverZoom, 1, 3, 1) };
}
function themeOf(data, customs) {
  if (data.themeId) {
    const t = customs.get(data.themeId);
    const color = t?.color ?? (HEX.test(data.themeColor || '') ? data.themeColor : null);
    if (color) return { category: t?.name ?? data.category, dye: dyeKeyForHex(color), themeId: data.themeId };
  }
  return { category: data.category, dye: dyeOf(data.category), themeId: null };
}
const isoOf = (d) => (typeof d === 'string' ? d : d.toISOString().slice(0, 10));
const slugOf = (file) => file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');

/* ---------- raw storage: a list of { name: "2026-09-04-title.md", text } ---------- */
function readLocalRaw() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort().map((name) => ({ name, text: fs.readFileSync(path.join(DIR, name), 'utf8') }));
}
async function listRaw(fresh = false) {
  if (remote()) {
    try {
      const s = await snapshot(fresh);
      return Object.entries(s.threads).map(([name, text]) => ({ name, text })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      const bundled = readLocalRaw(); // database unreachable: show the threads that ship with the site
      if (bundled.length) return bundled;
      throw e;
    }
  }
  return readLocalRaw();
}
async function putRaw(name, text) {
  const R = remote();
  if (R) { await cmd(R, 'HSET', K.threads, name, text); await invalidate(); return; }
  assertWritable();
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, name + '.tmp'), text, 'utf8');
  fs.renameSync(path.join(DIR, name + '.tmp'), path.join(DIR, name));
}
async function delRaw(name) {
  const R = remote();
  if (R) { await cmd(R, 'HDEL', K.threads, name); await invalidate(); return; }
  assertWritable();
  fs.unlinkSync(path.join(/* turbopackIgnore: true */ DIR, name));
}

// A thread's text is parsed once and reused until the text changes.
const memo = new Map();
const hash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function parsed(name, text) {
  const key = text.length + ':' + hash(text);
  const hit = memo.get(name);
  if (hit && hit.key === key) return hit.value;
  const { data, content } = parseFrontmatter(text);
  const blocks = parseBlocks(content);
  const value = { data, content, blocks, words: stripSizeTokens(content).split(/\s+/).filter(Boolean).length };
  memo.set(name, { key, value });
  return value;
}

async function build(fresh) {
  // Visitors never see an error because themes or photo ids could not be read; the Studio (fresh) always does.
  const soft = (p, fallback) => (fresh ? p : p.catch(() => fallback));
  const [raw, themes, imageIds] = await Promise.all([listRaw(fresh), soft(listThemes(fresh), []), soft(listImageIds(fresh), new Set())]);
  const customs = new Map(themes.map((t) => [t.id, t]));
  const items = raw
    .map(({ name, text }) => {
      const { data, blocks, words } = parsed(name, text);
      if (data.draft) return null;
      const th = themeOf(data, customs);
      return {
        slug: slugOf(name),
        title: data.title,
        date: isoOf(data.date),
        category: th.category,
        dye: th.dye,
        themeId: th.themeId,
        motif: data.motif,
        size: SIZES.includes(data.size) ? data.size : 'regular',
        cover: coverOf(data, imageIds),
        quotes: data.quotes ?? [],
        quoteSource: data.quoteSource ?? 'closing',
        blocks,
        excerpt: excerptOf(blocks),
        words,
        minutes: Math.max(1, Math.round(words / 210)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
  items.forEach((t, i) => (t.number = i + 1));
  return items.reverse();
}

/** Every published thread, newest first. Deduplicated per request, so a page can call it freely. */
export const getThreads = cache(() => build(false));
/** The same, but never from a cache. Used by the Studio and whenever a thread may have just been published. */
export const getThreadsFresh = () => build(true);

export async function getThread(slug) {
  const found = (await getThreads()).find((t) => t.slug === slug);
  if (found || !remote()) return found;
  return (await getThreadsFresh()).find((t) => t.slug === slug); // published a moment ago on another server instance
}

export async function neighbours(slug) {
  let all = await getThreads();
  let i = all.findIndex((t) => t.slug === slug);
  if (i < 0 && remote()) { all = await getThreadsFresh(); i = all.findIndex((t) => t.slug === slug); }
  return { newer: all[i - 1] ?? null, older: all[i + 1] ?? null, total: all.length };
}

/** The raw fields of a thread, for the composer's "edit" mode. */
export async function getRawThread(slug) {
  const hit = (await listRaw(true)).find((f) => slugOf(f.name) === slug);
  if (!hit) return null;
  const { data, content } = parseFrontmatter(hit.text);
  const imageIds = await listImageIds(true);
  return {
    slug,
    title: data.title,
    date: isoOf(data.date),
    category: data.category,
    themeId: data.themeId || null,
    themeColor: data.themeColor || null,
    theme: data.themeId || data.category,
    motif: data.motif,
    size: SIZES.includes(data.size) ? data.size : 'regular',
    cover: coverOf(data, imageIds),
    quotes: data.quotes ?? [],
    body: content.trim(),
  };
}

const addDays = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Create or update a thread. Everything is validated; nothing the browser sends is trusted. */
export async function saveThread(p) {
  const title = String(p.title || '').trim().slice(0, 120);
  const body = String(p.body || '').trim();
  if (!title) throw new Error('Give the thread a title.');
  if (!body) throw new Error('The thread has no words yet.');
  if (body.length > 60000) throw new Error('That is too long for one thread.');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') && !Number.isNaN(Date.parse(p.date)) ? p.date : todayISO();
  // Date rules (the Studio's calendar enforces the same ones; this is the safety net).
  // One day of slack for the future check so a different time zone never rejects a valid "today".
  if (date > addDays(todayISO(), 1)) throw new Error('That date is in the future. Pick today or an earlier day.');
  const all = await getThreadsFresh();
  const others = all.filter((t) => t.slug !== p.editSlug);
  if (others.some((t) => t.date === date)) throw new Error('A thread is already woven on that date. Pick a day with no thread.');
  const earliest = all.map((t) => t.date).sort()[0];
  if (earliest && date < earliest.slice(0, 7) + '-01') throw new Error('That is before the first month of the journal.');
  const key = p.theme ?? p.category;
  const builtin = CATEGORIES.find((c) => c.name === key)?.name;
  const custom = builtin ? null : await getTheme(key, true);
  const category = builtin || custom?.name || 'Discipline';
  const motif = MOTIFS.includes(p.motif) ? p.motif : 'road';
  const size = SIZES.includes(p.size) ? p.size : 'regular';
  const quotes = (Array.isArray(p.quotes) ? p.quotes : []).map((q) => String(q).trim().slice(0, 300)).filter(Boolean).slice(0, 2);

  const files = (await listRaw(true)).map((f) => f.name);
  let slug, oldFile = null;
  if (p.editSlug) {
    if (!/^[a-z0-9-]+$/.test(p.editSlug)) throw new Error('Unknown thread.');
    oldFile = files.find((f) => slugOf(f) === p.editSlug);
    if (!oldFile) throw new Error('That thread no longer exists.');
    slug = p.editSlug; // URLs (and comments) stay attached to the thread
  } else {
    const taken = new Set(files.map(slugOf));
    const base = slugify(title);
    slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  }
  const file = `${date}-${slug}.md`;

  const cv = p.cover && typeof p.cover === 'object' ? p.cover : {};
  const imageIds = await listImageIds(true);
  const coverId = typeof cv.id === 'string' && imageIds.has(cv.id) ? cv.id : null;
  const cx = clamp(cv.x, 0, 100, 50), cy = clamp(cv.y, 0, 100, 50), cz = clamp(cv.zoom, 1, 3, 1);

  const fm = ['---', `title: ${JSON.stringify(title)}`, `date: ${date}`, `category: ${JSON.stringify(category)}`];
  if (custom) fm.push(`themeId: ${custom.id}`, `themeColor: ${JSON.stringify(custom.color)}`);
  fm.push(`motif: ${motif}`, `size: ${size}`);
  if (coverId) fm.push(`cover: ${coverId}`);
  if (cx !== 50) fm.push(`coverX: ${cx}`);
  if (cy !== 50) fm.push(`coverY: ${cy}`);
  if (cz !== 1) fm.push(`coverZoom: ${cz}`);
  if (quotes.length) fm.push('quoteSource: closing', 'quotes:', ...quotes.map((q) => `  - ${JSON.stringify(q)}`));
  fm.push('---');
  const text = fm.join('\n') + '\n' + blocksFromInput(body, p.eachLine !== false) + '\n';
  await putRaw(file, text);
  if (oldFile && oldFile !== file) await delRaw(oldFile);
  return { slug, file, title, edited: !!oldFile };
}

/** When a custom theme is removed, its threads move to a built-in theme (the thread is rewritten, nothing else changes). */
export async function reassignTheme(themeId, builtinName) {
  const target = CATEGORIES.find((c) => c.name === builtinName)?.name || 'Discipline';
  let moved = 0;
  for (const { name, text } of await listRaw(true)) {
    const raw = text.replace(/\r\n?/g, '\n');
    const m = raw.match(/^(---[ \t]*\n)([\s\S]*?)(\n---[ \t]*(?:\n|$))([\s\S]*)$/);
    if (!m || !new RegExp(`^themeId:\\s*${themeId}\\s*$`, 'm').test(m[2])) continue;
    const head = m[2]
      .replace(/^category:.*$/m, `category: ${JSON.stringify(target)}`)
      .replace(/^themeId:.*\n?/m, '')
      .replace(/^themeColor:.*\n?/m, '')
      .replace(/\n+$/, '');
    await putRaw(name, m[1] + head + m[3] + m[4]);
    moved++;
  }
  return moved;
}

/** How many threads use each custom theme, from one fresh read: { themeId: count }. */
export async function themeCounts() {
  const counts = {};
  for (const t of await getThreadsFresh()) if (t.themeId) counts[t.themeId] = (counts[t.themeId] || 0) + 1;
  return counts;
}
