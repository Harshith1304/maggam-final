// Pure text helpers shared by the server, the public pages and the composer preview.
// Nothing here touches the file system, so it is safe in the browser too.
import { dyeOf } from './dyes';

export const SIZES = ['small', 'regular', 'large'];
// A paragraph can carry its own size. It is stored as a marker at the start of the block, e.g. "{large} Text".
export const PARA_SIZES = ['small', 'regular', 'large', 'xl'];
export const SIZE_RE = /^\{(small|large|xl)\}[ \t]*/;
export const stripSizeTokens = (s) => s.replace(/(^|\n)\{(small|large|xl)\}[ \t]*/g, '$1');

/** Split a paragraph into small "beats" at sentence boundaries. Words are never altered. */
export function toBeats(text, max = 300) {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z"(\d])/);
  const beats = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && (cur + ' ' + s).length > max) {
      beats.push(cur);
      cur = s;
    } else cur = cur ? cur + ' ' + s : s;
  }
  if (cur) beats.push(cur);
  return beats;
}

export function parseBlocks(body) {
  return body
    .trim()
    .split(/\n{2,}/)
    .filter((c) => c.trim())
    .map((chunk) => {
      let c = chunk.trim();
      let size = 'regular';
      const m = c.match(SIZE_RE);
      if (m) { size = m[1]; c = c.slice(m[0].length); }
      const lines = c.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length && lines.every((l) => l.startsWith('- '))) return { type: 'ul', size, items: lines.map((l) => l.slice(2)) };
      if (lines.length && lines.every((l) => /^\d+\.\s/.test(l))) return { type: 'ol', size, items: lines.map((l) => l.replace(/^\d+\.\s/, '')) };
      return { type: 'p', size, beats: toBeats(lines.join(' ')) };
    });
}

export function excerptOf(blocks, max = 150) {
  const first = blocks.find((b) => b.type === 'p');
  if (!first) return '';
  const t = first.beats[0];
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

export function formatDate(iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
}

export const slugify = (s) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'thread';

/** Turn what was typed into the markdown body that is stored. Optionally every Enter becomes a new paragraph. */
export function blocksFromInput(body, eachLine = true) {
  const text = String(body).replace(/\r\n?/g, '\n').trim();
  if (!eachLine) return text.replace(/\n{3,}/g, '\n\n');
  const out = [];
  let listKind = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) { listKind = null; continue; }
    const kind = line.startsWith('- ') ? 'ul' : /^\d+\.\s/.test(line) ? 'ol' : null;
    if (kind && listKind === kind) out[out.length - 1] += '\n' + line;
    else out.push(line);
    listKind = kind;
  }
  return out.join('\n\n');
}

/** Build a thread-shaped object from composer fields (used for the live preview). */
export function buildThread(d, extra = {}) {
  const md = blocksFromInput(d.body || '', d.eachLine !== false);
  const words = stripSizeTokens(md).split(/\s+/).filter(Boolean).length;
  return {
    slug: d.slug || 'draft',
    title: d.title || 'Untitled thread',
    date: d.date,
    category: d.category,
    dye: d.dye || dyeOf(d.category),
    motif: d.motif,
    size: d.size || 'regular',
    quotes: (d.quotes || []).map((q) => q.trim()).filter(Boolean),
    blocks: parseBlocks(md || ' '),
    words,
    minutes: Math.max(1, Math.round(words / 210)),
    ...extra,
  };
}
