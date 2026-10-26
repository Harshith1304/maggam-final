'use client';

import { useEffect, useRef, useState } from 'react';
import { formatDate } from '@/lib/text';

const pad2 = (n) => String(n).padStart(2, '0');
const ym = (iso) => +iso.slice(0, 4) * 12 + (+iso.slice(5, 7) - 1);
export const localISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
export const prevDay = (iso) => new Date(Date.parse(iso + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);

/* The site's own date picker: same calendar look as the ledger.
   Days that already have a thread show as woven and can't be chosen, future days are locked,
   and nothing before the journal's first month can be reached. */
export default function DatePicker({ value, onChange, taken, minDate }) {
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState('');
  const [view, setView] = useState(0);
  const box = useRef(null);

  useEffect(() => setToday(localISO()), []);
  useEffect(() => { if (open) setView(ym(value || today || localISO())); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const t = today || localISO();
  const minM = ym(minDate), maxM = ym(t);
  const year = Math.floor(view / 12), mon = view % 12;
  const title = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, mon, 1)));
  const lead = (new Date(Date.UTC(year, mon, 1)).getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(year, mon + 1, 0)).getUTCDate();
  const go = (d) => { const n = view + d; if (n >= minM && n <= maxM) setView(n); };

  return (
    <div className="datepick" ref={box}>
      <button type="button" className="datepick-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}>
        <span>{value ? formatDate(value) : 'Pick a date'}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
      </button>

      {open && (
        <div className="datepick-pop" role="dialog" aria-label="Choose the date of this thread">
          <div className="cal-nav">
            <button type="button" className="cal-arrow cal-arrow--prev" onClick={() => go(-1)} aria-label="Previous month" data-off={view <= minM} tabIndex={view <= minM ? -1 : 0}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <h3 className="cal-month datepick-month" aria-live="polite">{title}</h3>
            <button type="button" className="cal-arrow cal-arrow--next" onClick={() => go(1)} aria-label="Next month" data-off={view >= maxM} tabIndex={view >= maxM ? -1 : 0}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="cal-head" aria-hidden="true">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="cal-grid">
            {Array.from({ length: lead }, (_, i) => <span key={'p' + i} className="cell pad" aria-hidden="true" />)}
            {Array.from({ length }, (_, i) => {
              const n = i + 1, iso = `${year}-${pad2(mon + 1)}-${pad2(n)}`;
              if (iso < minDate) return <span key={iso} className="cell pad" aria-hidden="true" />;
              if (taken.has(iso)) return <span key={iso} className="cell on" title="A thread is already woven on this day" aria-label={`${n}: already woven`}><span>{n}</span></span>;
              if (iso > t) return <span key={iso} className="cell future" title="Future days can't be chosen" aria-label={`${n}: not yet`}><span>{n}</span></span>;
              return (
                <button key={iso} type="button" className={'cell gap pickable' + (iso === value ? ' pick' : '')} aria-pressed={iso === value} aria-label={formatDate(iso)} onClick={() => { onChange(iso); setOpen(false); }}>
                  <span>{n}</span>
                </button>
              );
            })}
          </div>
          <ul className="ledger-key datepick-key" aria-hidden="true">
            <li><i className="key on" />Already woven</li>
            <li><i className="key gap" />Open</li>
          </ul>
        </div>
      )}
    </div>
  );
}
