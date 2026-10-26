import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin, deny } from '@/lib/auth';
import { saveImage, listImages, maxUpload } from '@/lib/media';

export async function GET() {
  if (!(await isAdmin())) return deny();
  return NextResponse.json({ ok: true, images: await listImages() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (!sameOrigin(request)) return deny(403, 'Cross-site request blocked');
  if (!(await isAdmin())) return deny();
  let file;
  try { file = (await request.formData()).get('file'); } catch { return deny(400, 'Could not read that upload.'); }
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') return deny(400, 'Choose a picture first.');
  const max = maxUpload();
  if (file.size > max) return deny(413, `That picture is over ${Math.round(max / 1048576)} MB. Try a smaller one.`);
  try {
    const id = await saveImage(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ ok: true, id, url: `/media/${id}/` });
  } catch (e) {
    return deny(400, e.message);
  }
}
