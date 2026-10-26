// Cover photos you upload from your own files. They are checked by their real file signature and served
// through /media/<id>/. Stored as files on your own computer or server (data/uploads), and as small pieces
// in the database on Vercel.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { remote, snapshot, invalidate, assertWritable } from './backend';
import { putImage, getImage, cmd, K, toObject } from './remote-core';

const DATA = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), 'data');
export const UPLOAD_DIR = path.join(DATA, 'uploads');
const TYPES = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
const ID = /^[a-f0-9]{24}$/;

/** Vercel accepts requests up to about 4.5 MB, so uploads are limited to 4 MB there (the browser shrinks photos first). */
export const maxUpload = () => (remote() ? 4 * 1024 * 1024 : 8 * 1024 * 1024);

/** Identify an image by its first bytes. The file name or the browser's claim is never trusted. */
export function sniff(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buf.toString('ascii', 0, 3) === 'GIF') return 'gif';
  return null;
}

export async function saveImage(buf) {
  const ext = sniff(buf);
  if (!ext) throw new Error('Please choose a PNG, JPG, WebP or GIF picture.');
  const id = crypto.randomBytes(12).toString('hex');
  const R = remote();
  if (R) {
    await putImage(R, id, buf, TYPES[ext]);
    await invalidate();
    return id;
  }
  assertWritable();
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, `${id}.${ext}`), buf);
  return id;
}

/** The ids of every stored photo. */
export async function listImageIds(fresh = false) {
  if (remote()) return new Set((await snapshot(fresh)).media);
  if (!fs.existsSync(UPLOAD_DIR)) return new Set();
  return new Set(fs.readdirSync(UPLOAD_DIR).map((f) => f.split('.')[0]).filter((id) => ID.test(id)));
}

export async function readImage(id) {
  if (typeof id !== 'string' || !ID.test(id)) return null;
  const R = remote();
  if (R) return getImage(R, id);
  for (const ext of Object.keys(TYPES)) {
    const file = path.join(UPLOAD_DIR, `${id}.${ext}`);
    if (fs.existsSync(file)) return { buffer: fs.readFileSync(file), type: TYPES[ext] };
  }
  return null;
}

/** Newest first, for the "My photos" tab. */
export async function listImages() {
  const R = remote();
  if (R) {
    const meta = toObject(await cmd(R, 'HGETALL', K.media));
    return Object.entries(meta)
      .map(([id, js]) => { let at = 0; try { at = JSON.parse(js).at || 0; } catch {} return { id, at }; })
      .sort((a, b) => b.at - a.at)
      .map((x) => ({ id: x.id, url: `/media/${x.id}/` }));
  }
  if (!fs.existsSync(UPLOAD_DIR)) return [];
  return fs.readdirSync(UPLOAD_DIR)
    .map((f) => ({ id: f.split('.')[0], t: fs.statSync(path.join(UPLOAD_DIR, f)).mtimeMs }))
    .filter((x) => ID.test(x.id))
    .sort((a, b) => b.t - a.t)
    .map((x) => ({ id: x.id, url: `/media/${x.id}/` }));
}
