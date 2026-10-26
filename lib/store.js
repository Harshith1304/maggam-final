// Comments and likes. On your own computer or server: one small JSON file (data/comments.json), written one
// change at a time and replaced atomically. On Vercel: one hash in the database, one entry per comment.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { remote, assertWritable } from './backend';
import { cmd, pipe, K, toObject } from './remote-core';

const DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), 'data');
const FILE = path.join(DIR, 'comments.json');
const G = (globalThis.__maggamComments ||= { queue: Promise.resolve() }); // shared by every route

const parse = (v) => { try { return JSON.parse(v); } catch { return null; } };

async function readFile() {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { return { comments: [] }; }
}
async function writeFile(db) {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 1), 'utf8');
  await fs.rename(tmp, FILE);
}

async function readRemote(R) {
  const raw = toObject(await cmd(R, 'HGETALL', K.comments));
  return { raw, db: { comments: Object.values(raw).map(parse).filter(Boolean) } };
}

async function snapshot() {
  const R = remote();
  if (R) return (await readRemote(R)).db;
  await G.queue.catch(() => {});
  return readFile();
}

function mutate(fn) {
  const R = remote();
  if (R) {
    // read everything, apply the change, then write back only the comments that changed or were removed
    return (async () => {
      const { raw, db } = await readRemote(R);
      const out = await fn(db);
      const after = new Map(db.comments.map((c) => [c.id, JSON.stringify(c)]));
      const cmds = [];
      for (const [id, js] of after) if (raw[id] !== js) cmds.push(['HSET', K.comments, id, js]);
      const gone = Object.keys(raw).filter((id) => !after.has(id));
      if (gone.length) cmds.push(['HDEL', K.comments, ...gone]);
      if (cmds.length) await pipe(R, cmds);
      return out;
    })();
  }
  try { assertWritable(); } catch (e) { return Promise.reject(e); }
  const run = G.queue.then(async () => {
    const db = await readFile();
    const out = await fn(db);
    await writeFile(db);
    return out;
  });
  G.queue = run.catch(() => {});
  return run;
}

const view = (c, vid) => ({
  id: c.id, parentId: c.parentId, replyTo: c.replyTo, name: c.name, message: c.message,
  createdAt: c.createdAt, author: !!c.author, likes: c.likes.length, liked: !!vid && c.likes.includes(vid),
});

export async function listForThread(slug, vid) {
  const db = await snapshot();
  return db.comments.filter((c) => c.slug === slug).map((c) => view(c, vid));
}

export function addComment({ slug, name, message, parentId, vid, author }) {
  return mutate((db) => {
    let root = null, replyTo = null;
    if (parentId) {
      const parent = db.comments.find((c) => c.id === parentId && c.slug === slug);
      if (!parent) throw new Error('The comment you replied to is gone.');
      root = parent.parentId || parent.id; // replies stay one level deep
      replyTo = parent.name;
    }
    const c = { id: crypto.randomUUID(), slug, parentId: root, replyTo, name, message, createdAt: new Date().toISOString(), author: !!author, read: !!author, likes: [] };
    db.comments.push(c);
    return view(c, vid);
  });
}

export function toggleLike(id, vid) {
  return mutate((db) => {
    const c = db.comments.find((x) => x.id === id);
    if (!c) throw new Error('That comment is gone.');
    const i = c.likes.indexOf(vid);
    if (i >= 0) c.likes.splice(i, 1); else c.likes.push(vid);
    return { liked: i < 0, likes: c.likes.length };
  });
}

export function deleteComment(id) {
  return mutate((db) => {
    const before = db.comments.length;
    db.comments = db.comments.filter((c) => c.id !== id && c.parentId !== id);
    return before - db.comments.length;
  });
}

export function markRead(ids) {
  return mutate((db) => {
    let n = 0;
    for (const c of db.comments) if (!c.read && (ids === 'all' || ids.includes(c.id))) { c.read = true; n++; }
    return n;
  });
}

export async function everything() {
  const db = await snapshot();
  return db.comments.map((c) => ({ ...view(c, null), slug: c.slug, read: !!c.read }));
}

export async function unreadCount() {
  const db = await snapshot();
  return db.comments.filter((c) => !c.read && !c.author).length;
}
