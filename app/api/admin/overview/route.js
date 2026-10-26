import { NextResponse } from 'next/server';
import { isAdmin, deny } from '@/lib/auth';
import { everything } from '@/lib/store';
import { getThreadsFresh, themeCounts } from '@/lib/threads';
import { listThemes } from '@/lib/themes';
import { storageStatus } from '@/lib/backend';

export async function GET() {
  if (!(await isAdmin())) return deny();
  const threads = await getThreadsFresh();
  const uses = await themeCounts();
  const titles = new Map(threads.map((t) => [t.slug, t.title]));
  const all = (await everything())
    .filter((c) => titles.has(c.slug))
    .map((c) => ({ ...c, threadTitle: titles.get(c.slug) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const counts = {};
  all.forEach((c) => (counts[c.slug] = (counts[c.slug] || 0) + 1));
  return NextResponse.json({
    ok: true,
    storage: storageStatus(),
    unread: all.filter((c) => !c.read && !c.author).length,
    comments: all,
    threads: threads.map((t) => ({ slug: t.slug, title: t.title, date: t.date, number: t.number, category: t.category, themeId: t.themeId, comments: counts[t.slug] || 0 })),
    themes: (await listThemes(true)).map((t) => ({ ...t, uses: uses[t.id] || 0 })),
    stats: { threads: threads.length, comments: all.length, likes: all.reduce((n, c) => n + c.likes, 0) },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
