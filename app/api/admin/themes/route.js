import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin, deny } from '@/lib/auth';
import { listThemes, createTheme, updateTheme, removeTheme, isThemeId } from '@/lib/themes';
import { reassignTheme, themeCounts } from '@/lib/threads';

const withUses = async () => {
  const uses = await themeCounts();
  return (await listThemes(true)).map((t) => ({ ...t, uses: uses[t.id] || 0 }));
};

export async function GET() {
  if (!(await isAdmin())) return deny();
  return NextResponse.json({ ok: true, themes: await withUses() }, { headers: { 'Cache-Control': 'no-store' } });
}

// One endpoint: { action: 'create' | 'update' | 'delete', id?, name?, color?, moveTo? }.
// The four built-in themes are not stored here, so they cannot be touched through it.
export async function POST(request) {
  if (!sameOrigin(request)) return deny(403, 'Cross-site request blocked');
  if (!(await isAdmin())) return deny();
  const p = await request.json().catch(() => null);
  if (!p) return deny(400, 'Bad request');
  try {
    if (p.action === 'create') {
      const theme = await createTheme({ name: p.name, color: p.color });
      return NextResponse.json({ ok: true, theme, themes: await withUses() });
    }
    if (p.action === 'update') {
      const theme = await updateTheme(String(p.id || ''), { name: p.name, color: p.color });
      return NextResponse.json({ ok: true, theme, themes: await withUses() });
    }
    if (p.action === 'delete') {
      const id = String(p.id || '');
      if (!isThemeId(id)) return deny(400, 'Only your own themes can be removed.');
      const moved = await reassignTheme(id, p.moveTo);
      await removeTheme(id);
      return NextResponse.json({ ok: true, moved, themes: await withUses() });
    }
    return deny(400, 'Unknown action');
  } catch (e) {
    return deny(400, e.message);
  }
}
