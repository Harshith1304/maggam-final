import { sceneSVG, MOTIFS } from '@/lib/art';
import { DYES } from '@/lib/dyes';

// The 30 illustrations, served as ordinary cacheable pictures: /art/<motif>-<dye>/
// where <dye> is a built-in name (indigo, madder, ...) or the six hex digits of one of your own colours.
export async function GET(request, { params }) {
  const { file } = await params;
  const m = /^([a-z]+)-([a-z]+|[0-9a-f]{6})$/.exec(file || '');
  if (!m || !MOTIFS.includes(m[1])) return new Response('Not found', { status: 404 });
  const dye = DYES[m[2]] ? m[2] : /^[0-9a-f]{6}$/.test(m[2]) ? 'c-' + m[2] : null;
  if (!dye) return new Response('Not found', { status: 404 });
  return new Response(sceneSVG(m[1], dye, 'a'), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' },
  });
}
