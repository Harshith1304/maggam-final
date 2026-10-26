import ThreadsLink from './ThreadsLink';
import { paletteOf } from '@/lib/dyes';
import { formatDate } from '@/lib/text';
import ReadingTools from './ReadingTools';
import QuoteCard from './QuoteCard';
import Cover from './Cover';

/* The one and only layout of a thread. The public page and the Studio's live preview both render this,
   so what you see while writing is exactly what visitors get. */
export default function ThreadArticle({ thread: t, total, children }) {
  const d = paletteOf(t.dye);
  const style = { '--sw-bg': d.bg, '--sw-c1': d.c1, '--sw-hi': d.c2, '--sw-fg': d.fg };

  return (
    <article className="thread" style={style}>
      <div className="thread-banner">
        <Cover motif={t.motif} dye={t.dye} cover={t.cover} />
      </div>
      <div className="thread-fringe" aria-hidden="true" />

      <header className="thread-head">
        <ThreadsLink className="back">All threads</ThreadsLink>
        <h1 className="thread-title">{t.title}</h1>
        <p className="thread-meta">
          <span className="cat"><i />{t.category}</span>
          <time dateTime={t.date}>{formatDate(t.date)}</time>
          <span>{t.minutes} min read</span>
          <span>No. {t.number} of {total}</span>
        </p>
        <ReadingTools />
      </header>

      <div className="thread-body" data-size={t.size}>
        {t.blocks.map((b, i) =>
          b.type === 'p' ? (
            <div className="para" data-size={b.size} key={i}>
              {b.beats.map((beat, k) => <p className="beat" key={k}>{beat}</p>)}
            </div>
          ) : (
            <div className="para para--list" data-size={b.size} key={i}>
              {b.type === 'ul' ? (
                <ul>{b.items.map((it, k) => <li key={k}>{it}</li>)}</ul>
              ) : (
                <ol>{b.items.map((it, k) => <li key={k}>{it}</li>)}</ol>
              )}
            </div>
          )
        )}

        {t.quotes.length > 0 && (
          <figure className="closing">
            {t.quotes.map((q, i) => <blockquote key={i}><p>{q}</p></blockquote>)}
          </figure>
        )}

        <div className="sig-row">
          <p className="sig">
            <span className="sig-name">Harshith</span>
            <svg className="sig-flourish" viewBox="0 0 220 24" aria-hidden="true"><path d="M3 16 C 50 2, 100 22, 217 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
            <time className="sig-date" dateTime={t.date}>{formatDate(t.date)}</time>
          </p>
        </div>
      </div>

      {t.quotes.length > 0 && (
        <QuoteCard
          slug={t.slug}
          title={t.title}
          quotes={t.quotes}
          dye={t.dye}
          motif={t.motif}
          cover={t.cover}
          dateLabel={formatDate(t.date, { day: 'numeric', month: 'short', year: 'numeric' })}
        />
      )}

      {children}
    </article>
  );
}
