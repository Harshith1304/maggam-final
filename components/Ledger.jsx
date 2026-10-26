'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const toMs = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const localISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const ym = (iso) => +iso.slice(0, 4) * 12 + (+iso.slice(5, 7) - 1); // month as a single counting number
const short = (iso) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
const pad2 = (n) => String(n).padStart(2, '0');

function Arrow({ dir, ...rest }) {
  return (
    <button type="button" className={'cal-arrow cal-arrow--' + dir} {...rest}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

export default function Ledger({ threads }) {
  const [today, setToday] = useState(null);
  const byDate = useMemo(() => new Map(threads.map((t) => [t.date, t])), [threads]);
  const dates = useMemo(() => [...byDate.keys()].sort(), [byDate]);
  const first = dates[0], last = dates[dates.length - 1];

  const minM = ym(first);
  const maxM = Math.max(ym(last), today ? ym(today) : 0);
  const [view, setView] = useState(ym(last));
  const [dir, setDir] = useState('next');
  const moved = useRef(false);

  useEffect(() => {
    const t = localISO();
    setToday(t);
    if (!moved.current) setView(Math.max(ym(last), ym(t))); // open on the current month
  }, [last]);

  const go = (delta) => {
    const next = view + delta;
    if (next < minM || next > maxM) return;
    moved.current = true;
    setDir(delta > 0 ? 'next' : 'prev');
    setView(next);
  };

  const year = Math.floor(view / 12), mon = view % 12;
  const title = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, mon, 1)));
  const lead = (new Date(Date.UTC(year, mon, 1)).getUTCDay() + 6) % 7; // Monday first
  const length = new Date(Date.UTC(year, mon + 1, 0)).getUTCDate();
  const limit = today && today > last ? today : last;
  const doneToday = today ? byDate.has(today) : null;

  const days = Array.from({ length }, (_, i) => {
    const iso = `${year}-${pad2(mon + 1)}-${pad2(i + 1)}`;
    const t = byDate.get(iso);
    return { iso, n: i + 1, t, kind: iso < first ? 'before' : t ? 'on' : iso > limit ? 'future' : 'gap' };
  });

  // swipe to change month on touch screens
  const touch = useRef(null);
  const onTouchStart = (e) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  };

  return (
    <section className="ledger" aria-labelledby="ledger-h">
      <div className="ledger-in">
        <div className="ledger-text">
          <h2 id="ledger-h" className="sec-title">The ledger</h2>
          <p className="ledger-sub">Each square is one day. A lit square means a thread was written that day.</p>
          <ul className="ledger-key" aria-label="How to read the calendar">
            <li><i className="key on" aria-hidden="true" />Thread written</li>
            <li><i className="key gap" aria-hidden="true" />No thread that day</li>
          </ul>
          {doneToday !== null && (
            <p className={'ledger-today' + (doneToday ? ' is-done' : '')}>
              {doneToday ? "Today's thread is on the loom." : "Today's thread isn't woven yet."}
            </p>
          )}
        </div>

        <div className="ledger-cal" onKeyDown={onKeyDown} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="cal-nav">
            <Arrow dir="prev" onClick={() => go(-1)} aria-label="Previous month" tabIndex={view > minM ? 0 : -1} data-off={view <= minM} />
            <h3 className="cal-month" aria-live="polite">{title}</h3>
            <Arrow dir="next" onClick={() => go(1)} aria-label="Next month" tabIndex={view < maxM ? 0 : -1} data-off={view >= maxM} />
          </div>
          <div className="cal-head" aria-hidden="true">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className={'cal-grid cal-slide-' + dir} key={view}>
            {Array.from({ length: lead }, (_, i) => <span key={'p' + i} className="cell pad" aria-hidden="true" />)}
            {days.map((d) => {
              const isToday = today === d.iso;
              if (d.kind === 'before') return <span key={d.iso} className="cell pad" aria-hidden="true" />;
              if (d.kind === 'on') {
                return (
                  <Link key={d.iso} href={`/threads/${d.t.slug}/`} className={'cell on' + (isToday ? ' now' : '')} title={`${short(d.iso)}: ${d.t.title}`} aria-label={`${short(d.iso)}: ${d.t.title}`}>
                    <span>{d.n}</span>
                  </Link>
                );
              }
              return (
                <span key={d.iso} className={'cell ' + d.kind + (isToday ? ' now' : '')} title={d.kind === 'future' ? short(d.iso) : `${short(d.iso)}: no thread`}>
                  <span>{d.n}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
