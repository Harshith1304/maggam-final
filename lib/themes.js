// Your own themes (dyes). The four built-in ones live in lib/dyes.js and can never be changed here.
// Kept in data/themes.json on your own computer or server, and in the database on Vercel.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CATEGORIES } from './dyes';
import { remote, snapshot, invalidate, assertWritable } from './backend';
import { cmd, K } from './remote-core';

const DATA = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), 'data');
const FILE = path.join(DATA, 'themes.json');
export const MAX_THEMES = 20;
export const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^t[a-f0-9]{10}$/;
const NAME = /^[\p{L}\p{N} &'’.\-]{1,24}$/u;

const clean = (list) => (list || []).filter((t) => t && ID.test(t.id) && HEX.test(t.color) && t.name);

let memo = null;
function readFile() {
  try {
    const st = fs.statSync(FILE);
    const key = `${st.mtimeMs}:${st.size}`;
    if (memo && memo.key === key) return memo.list;
    const list = clean(JSON.parse(fs.readFileSync(FILE, 'utf8')).themes);
    memo = { key, list };
    return list;
  } catch {
    return [];
  }
}
async function read(fresh = false) {
  if (remote()) return clean((await snapshot(fresh)).themes);
  return readFile();
}
async function write(list) {
  const R = remote();
  if (R) {
    await cmd(R, 'SET', K.themes, JSON.stringify({ themes: list }));
    await invalidate();
    return;
  }
  assertWritable();
  fs.mkdirSync(DATA, { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ themes: list }, null, 1), 'utf8');
  fs.renameSync(tmp, FILE);
  memo = null;
}

export const listThemes = async (fresh = false) => (await read(fresh)).map((t) => ({ ...t }));
export const getTheme = async (id, fresh = false) => (await read(fresh)).find((t) => t.id === id) || null;
export const isThemeId = (id) => typeof id === 'string' && ID.test(id);

function check({ name, color }, selfId, list) {
  name = String(name ?? '').replace(/\s+/g, ' ').trim();
  if (!name) throw new Error('Give the theme a name.');
  if (!NAME.test(name)) throw new Error('Use letters, numbers, spaces and & - . \' only (up to 24 characters).');
  if (!HEX.test(String(color ?? ''))) throw new Error('Pick a colour for the theme.');
  const lower = name.toLowerCase();
  if (CATEGORIES.some((c) => c.name.toLowerCase() === lower)) throw new Error(`"${name}" is one of the built-in themes. Choose another name.`);
  if (list.some((t) => t.id !== selfId && t.name.toLowerCase() === lower)) throw new Error(`You already have a theme called "${name}".`);
  return { name, color: String(color).toLowerCase() };
}

export async function createTheme(input, forceId) {
  const list = (await read(true)).slice();
  if (list.length >= MAX_THEMES) throw new Error(`You can keep up to ${MAX_THEMES} custom themes. Remove one first.`);
  const ok = check(input, null, list);
  const t = { id: forceId && isThemeId(forceId) ? forceId : 't' + crypto.randomBytes(5).toString('hex'), ...ok, createdAt: new Date().toISOString() };
  list.push(t);
  await write(list);
  return t;
}

export async function updateTheme(id, input) {
  if (!isThemeId(id)) throw new Error('Unknown theme.');
  const list = (await read(true)).slice();
  const i = list.findIndex((t) => t.id === id);
  if (i < 0) throw new Error('That theme no longer exists.');
  list[i] = { ...list[i], ...check(input, id, list) };
  await write(list);
  return list[i];
}

export async function removeTheme(id) {
  if (!isThemeId(id)) throw new Error('Unknown theme.');
  const list = await read(true);
  if (!list.some((t) => t.id === id)) throw new Error('That theme no longer exists.');
  await write(list.filter((t) => t.id !== id));
}

/** If a thread remembers a theme that is missing from the store (for example the data was not copied), bring it back. */
export async function restoreTheme({ id, name, color }) {
  if (!isThemeId(id) || !HEX.test(color || '')) return;
  if (await getTheme(id, true)) return;
  try { await createTheme({ name, color }, id); } catch { /* name already taken: the thread keeps its remembered colour */ }
}
