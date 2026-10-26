import Link from 'next/link';
import { getThreads, formatDate } from '@/lib/threads';
import { themesInUse } from '@/lib/dyes';
import Ledger from '@/components/Ledger';
import ThreadGrid from '@/components/ThreadGrid';
import PullThread from '@/components/PullThread';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const threads = await getThreads();
  const latest = threads[0];
  const slim = threads.map((t) => ({
    slug: t.slug, title: t.title, date: t.date, dateLabel: formatDate(t.date, { day: 'numeric', month: 'short', year: 'numeric' }),
    category: t.category, dye: t.dye, motif: t.motif, cover: t.cover, excerpt: t.excerpt, minutes: t.minutes, number: t.number,
  }));

  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <h1 className="wordmark" aria-label="Maggam">
            <span className="wm-latin" aria-hidden="true">
              {'Maggam'.split('').map((c, i) => <span key={i} style={{ '--i': i }}>{c}</span>)}
            </span>
            <span className="wm-te" lang="te" aria-hidden="true">మగ్గం</span>
          </h1>
          <p className="hero-line">Thoughts, woven daily.</p>
          <p className="hero-sub">
            Short writings on discipline, people, solitude and the roads between, one thread a day. Nothing here is
            reworded after the fact.
          </p>
          {latest ? (
            <>
              <div className="hero-cta">
                <Link className="btn" href={`/threads/${latest.slug}/`}>Read the latest thread</Link>
                <PullThread slugs={threads.map((t) => t.slug)} />
              </div>
              <p className="hero-latest">
                <span>Newest on the loom</span>
                <Link href={`/threads/${latest.slug}/`}>{latest.title}</Link>
                <time dateTime={latest.date}>{formatDate(latest.date)}</time>
              </p>
            </>
          ) : (
            <p className="hero-latest"><span>The loom is still empty. The first thread will appear here.</span></p>
          )}
        </div>
        <a href="#ledger" className="hero-thread" aria-label="Scroll down">
          <svg viewBox="0 0 24 90" width="24" height="90" aria-hidden="true"><path d="M12 0 V70" stroke="var(--accent)" strokeWidth="2" /><circle cx="12" cy="78" r="6" fill="var(--accent)" /></svg>
        </a>
      </section>

      <div id="ledger" />
      {latest && <Ledger threads={slim.map(({ slug, title, date }) => ({ slug, title, date }))} />}

      {latest && <section id="cloth" className="cloth-section" aria-labelledby="cloth-h">
        <div className="wrap">
          <div className="cloth-head">
            <h2 id="cloth-h" className="sec-title">The cloth so far</h2>
            <p>
              Each swatch is dyed by what it is about: indigo for discipline, madder for people, myrobalan green for the
              self, turmeric for roots and roads. Tap a title to read the thread.
            </p>
          </div>
          <ThreadGrid threads={slim} themes={themesInUse(threads)} />
        </div>
      </section>}

      <section className="stitch">
        <div className="wrap stitch-in">
          <p className="stitch-big">Why “Maggam”?</p>
          <p>It is the Telugu word for a loom, and this is a place where thoughts are woven rather than posted.</p>
          <Link className="btn btn--ghost" href="/about/">Read the story of the name</Link>
        </div>
      </section>
    </>
  );
}
