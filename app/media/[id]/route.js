import { readImage } from '@/lib/media';

export async function GET(request, { params }) {
  const { id } = await params;
  let img = null;
  try { img = await readImage(id); } catch { return new Response('Storage unavailable', { status: 503 }); }
  if (!img) return new Response('Not found', { status: 404 });
  return new Response(img.buffer, {
    headers: {
      'Content-Type': img.type,
      // long browser cache, and the same for the host's edge cache, so a photo is read from storage only once
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
