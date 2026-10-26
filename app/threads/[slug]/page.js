import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getThread, neighbours } from '@/lib/threads';
import { paletteOf } from '@/lib/dyes';
import ThreadArticle from '@/components/ThreadArticle';
import Comments from '@/components/Comments';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const t = await getThread(slug);
  if (!t) return {};
  return { title: t.title, description: t.excerpt, openGraph: { title: t.title, description: t.excerpt, type: 'article', publishedTime: t.date } };
}

export default async function ThreadPage({ params }) {
  const { slug } = await params;
  const t = await getThread(slug);
  if (!t) notFound();
  const { newer, older, total } = await neighbours(slug);
  const tint = (x) => ({ '--pn-bg': paletteOf(x.dye).bg, '--pn-fg': paletteOf(x.dye).fg });

  return (
    <ThreadArticle thread={t} total={Math.max(total, t.number)}>
      <Comments slug={t.slug} />

      <nav className="pn" aria-label="More threads">
        {older ? (
          <Link href={`/threads/${older.slug}/`} className="pn-item" style={tint(older)}>
            <span>Older thread</span>
            <b>{older.title}</b>
          </Link>
        ) : <span />}
        {newer ? (
          <Link href={`/threads/${newer.slug}/`} className="pn-item pn-item--r" style={tint(newer)}>
            <span>Newer thread</span>
            <b>{newer.title}</b>
          </Link>
        ) : (
          <div className="pn-item pn-item--r pn-wait"><span>Next thread</span><b>Still on the loom</b></div>
        )}
      </nav>
    </ThreadArticle>
  );
}
