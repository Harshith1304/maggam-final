import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getRawThread, getThreadsFresh } from '@/lib/threads';
import Composer from '@/components/Composer';
import { listThemes, getTheme, restoreTheme } from '@/lib/themes';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Write a thread', robots: { index: false, follow: false } };

export default async function WritePage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login/');
  const { edit } = await searchParams;
  const all = await getThreadsFresh();
  const raw = typeof edit === 'string' && /^[a-z0-9-]+$/.test(edit) ? await getRawThread(edit) : null;
  if (raw?.themeId && !(await getTheme(raw.themeId, true))) await restoreTheme({ id: raw.themeId, name: raw.category, color: raw.themeColor });
  const initial = raw ? { ...raw, number: all.find((t) => t.slug === raw.slug)?.number } : null;
  const taken = all.map((t) => ({ date: t.date, slug: t.slug }));
  const minDate = all.length ? all.map((t) => t.date).sort()[0].slice(0, 7) + '-01' : '2026-09-01';
  return <Composer initial={initial} total={all.length} taken={taken} minDate={minDate} customThemes={await listThemes(true)} />;
}
