'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { paletteOf } from '@/lib/dyes';
import Cover from './Cover';

const SPANS = ['w7', 'w5', 'w4', 'w4', 'w4', 'w5', 'w7', 'w6', 'w6'];

export default function ThreadGrid({ threads, themes }) {
  const [active, setActive] = useState('All');
  const shown = useMemo(() => (active === 'All' ? threads : threads.filter((t) => t.category === active)), [active, threads]);

  return (
    <>
      <div className="chips" role="group" aria-label="Filter threads by dye">
        <button className={'chip' + (active === 'All' ? ' is-on' : '')} onClick={() => setActive('All')} aria-pressed={active === 'All'}>
          All <em>{threads.length}</em>
        </button>
        {themes.map((c) => (
          <button key={c.name} className={'chip' + (active === c.name ? ' is-on' : '')} onClick={() => setActive(c.name)} aria-pressed={active === c.name} title={c.line}>
            <i style={{ background: paletteOf(c.dye).bg, boxShadow: `inset 0 0 0 3px ${paletteOf(c.dye).c1}` }} />
            {c.name} <em>{threads.filter((t) => t.category === c.name).length}</em>
          </button>
        ))}
      </div>

      <ol className="cloth">
        {shown.map((t, i) => {
          const d = paletteOf(t.dye);
          return (
            <li
              key={t.slug}
              className={'swatch ' + SPANS[i % SPANS.length]}
              style={{ '--sw-bg': d.bg, '--sw-c1': d.c1, '--sw-fg': d.fg, '--sw-hi': d.c2, animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <div className="sw-art"><Cover motif={t.motif} dye={t.dye} cover={t.cover} /></div>
              <div className="sw-body">
                <p className="sw-meta">
                  <span>No. {t.number}</span>
                  <time dateTime={t.date}>{t.dateLabel}</time>
                </p>
                <h3 className="sw-title">
                  <Link href={`/threads/${t.slug}/`}>{t.title}</Link>
                </h3>
                <p className="sw-excerpt">{t.excerpt}</p>
                <p className="sw-foot">{t.category} <span aria-hidden="true">/</span> {t.minutes} min read</p>
              </div>
              <span className="sw-fringe" aria-hidden="true" />
            </li>
          );
        })}
      </ol>
    </>
  );
}
