'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CATEGORIES, paletteOf, dyeKeyForHex } from '@/lib/dyes';
import { buildThread, formatDate, blocksFromInput, SIZE_RE, stripSizeTokens } from '@/lib/text';
import ThreadArticle from './ThreadArticle';
import QuoteCard from './QuoteCard';
import GalleryPicker from './GalleryPicker';
import Cover from './Cover';
import Auto from './Auto';
import DatePicker, { localISO as pickToday, prevDay } from './DatePicker';
import ThemeDialog from './ThemeDialog';
import ThreadsLink from './ThreadsLink';
import { useConfirm } from './Confirm';

const localISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const PARA = [['small', 'A−', 'Smaller'], ['regular', 'A', 'Regular'], ['large', 'A+', 'Larger'], ['xl', 'A++', 'Biggest']];

let counter = 0;
const nid = () => ++counter;
const toBlocks = (body) => {
  const out = [];
  (body || '').split(/\n{2,}/).forEach((chunk) => {
    let t = chunk.trim();
    if (!t) return;
    let size = 'regular';
    const m = t.match(SIZE_RE);
    if (m) { size = m[1]; t = t.slice(m[0].length); }
    out.push({ id: nid(), text: t, size });
  });
  return out.length ? out : [{ id: nid(), text: '', size: 'regular' }];
};
const fromBlocks = (bs) => bs.filter((b) => b.text.trim()).map((b) => (b.size !== 'regular' ? `{${b.size}} ` : '') + b.text.trim()).join('\n\n');

export default function Composer({ initial, total, taken = [], minDate = '2026-09-01', customThemes = [] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const edit = initial?.slug || null;
  const key = 'maggam-compose-' + (edit || 'new');

  const [f, setF] = useState({
    title: initial?.title || '', date: initial?.date || '', theme: initial?.theme || 'Discipline',
    motif: initial?.motif || 'road', size: initial?.size || 'regular',
    q1: initial?.quotes?.[0] || '', q2: initial?.quotes?.[1] || '',
  });
  const [blocks, setBlocks] = useState(() => toBlocks(initial?.body || ''));
  const [cover, setCover] = useState({ id: initial?.cover?.id || null, x: initial?.cover?.x ?? 50, y: initial?.cover?.y ?? 50, zoom: initial?.cover?.zoom ?? 1 });
  const [customs, setCustoms] = useState(customThemes);
  const [themeDlg, setThemeDlg] = useState(null);
  const [mode, setMode] = useState('write');
  const [pick, setPick] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const set = (patch) => setF((s) => ({ ...s, ...patch }));
  const takenSet = useMemo(() => new Set(taken.filter((t) => t.slug !== edit).map((t) => t.date)), [taken, edit]);
  // the newest day that is not in the future and not already woven
  const freeDate = () => { let d = pickToday(); while (takenSet.has(d) && d > minDate) d = prevDay(d); return d; };
  const badDate = (d) => !d || d > pickToday() || d < minDate || takenSet.has(d);

  const refs = useRef({});
  const focusReq = useRef(null);
  useEffect(() => {
    const r = focusReq.current;
    if (!r) return;
    focusReq.current = null;
    const el = refs.current[r.id];
    if (el) { el.focus(); const p = r.pos === 'end' ? el.value.length : r.pos; el.setSelectionRange(p, p); }
  }, [blocks]);

  // restore an unfinished draft (new threads only) and default the date to today
  useEffect(() => {
    if (!edit) {
      try {
        const d = JSON.parse(localStorage.getItem(key) || 'null');
        if (d?.f) {
          const known = d.f.theme && (CATEGORIES.some((c) => c.name === d.f.theme) || customThemes.some((t) => t.id === d.f.theme));
          setF((s) => ({ ...s, ...d.f, theme: known ? d.f.theme : 'Discipline', date: badDate(d.f.date) ? freeDate() : d.f.date }));
          if (d.blocks?.length) setBlocks(d.blocks.map((b) => ({ id: nid(), text: String(b.text || ''), size: b.size || 'regular' })));
          if (d.cover) setCover(d.cover);
          return;
        }
      } catch {}
    }
    setF((s) => ({ ...s, date: s.date || freeDate() }));
  }, [edit, key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (edit || done) return;
    const t = setTimeout(() => { try { localStorage.setItem(key, JSON.stringify({ f, blocks, cover })); } catch {} }, 400);
    return () => clearTimeout(t);
  }, [f, blocks, cover, edit, key, done]);

  // every theme the composer can offer: the four built-ins (fixed) and your own
  const allThemes = useMemo(() => [
    ...CATEGORIES.map((c) => ({ key: c.name, name: c.name, dye: c.dye, line: c.line, builtin: true })),
    ...customs.map((t) => ({ key: t.id, name: t.name, dye: dyeKeyForHex(t.color), builtin: false, theme: t })),
  ], [customs]);
  const cur = allThemes.find((t) => t.key === f.theme) || allThemes[0];
  const d = paletteOf(cur.dye);
  const dyeVars = { '--sw-bg': d.bg, '--sw-c1': d.c1, '--sw-hi': d.c2, '--sw-fg': d.fg };
  const quotes = [f.q1, f.q2].map((q) => q.trim()).filter(Boolean);
  const body = fromBlocks(blocks);
  const words = stripSizeTokens(body).split(/\s+/).filter(Boolean).length;
  const coverObj = { src: cover.id ? `/media/${cover.id}/` : null, x: cover.x, y: cover.y, zoom: cover.zoom };
  const preview = useMemo(
    () => buildThread({ ...f, category: cur.name, dye: cur.dye, date: f.date || localISO(), body, eachLine: false, quotes, slug: edit || 'draft' }, { number: edit ? initial?.number ?? total : total + 1, cover: coverObj }),
    [f, body, cover, edit, cur.name, cur.dye] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /* ---- paragraph blocks ---- */
  const upd = (id, patch) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const insertAfter = (id, text = '', size = 'regular', pos = 0) => {
    const nb = { id: nid(), text, size };
    focusReq.current = { id: nb.id, pos };
    setBlocks((bs) => { const i = bs.findIndex((b) => b.id === id); const c = bs.slice(); c.splice(i + 1, 0, nb); return c; });
  };
  const move = (id, dir) => setBlocks((bs) => {
    const i = bs.findIndex((b) => b.id === id), j = i + dir;
    if (j < 0 || j >= bs.length) return bs;
    const c = bs.slice(); [c[i], c[j]] = [c[j], c[i]]; return c;
  });
  const remove = async (b) => {
    if (blocks.length === 1) { upd(b.id, { text: '' }); return; }
    if (b.text.trim().length > 60) {
      const ok = await confirm({ title: 'Remove this paragraph?', message: 'Its text will be taken out of the thread.', confirmLabel: 'Remove', cancelLabel: 'Keep it', danger: true });
      if (!ok) return;
    }
    setBlocks((bs) => bs.filter((x) => x.id !== b.id));
  };

  const onKey = (e, b, i) => {
    const ta = e.currentTarget;
    if (e.key === 'Backspace' && !b.text && blocks.length > 1 && ta.selectionStart === 0) {
      e.preventDefault();
      const prev = blocks[i - 1] || blocks[i + 1];
      focusReq.current = { id: prev.id, pos: 'end' };
      setBlocks((bs) => bs.filter((x) => x.id !== b.id));
      return;
    }
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    const pos = ta.selectionStart, end = ta.selectionEnd, text = b.text;
    const lines = text.split('\n');
    const idx = text.slice(0, pos).split('\n').length - 1;
    const m = lines[idx].match(/^(- |(\d+)\. )/);
    if (m) {
      if (lines[idx].trim() === m[0].trim()) { // empty list item: leave the list
        lines.splice(idx, 1);
        upd(b.id, { text: lines.join('\n') });
        insertAfter(b.id, '', b.size);
      } else {
        const marker = m[2] ? `${+m[2] + 1}. ` : '- ';
        upd(b.id, { text: text.slice(0, pos) + '\n' + marker + text.slice(end) });
        focusReq.current = { id: b.id, pos: pos + 1 + marker.length };
      }
      return;
    }
    upd(b.id, { text: text.slice(0, pos).trimEnd() });
    insertAfter(b.id, text.slice(end).trimStart(), b.size, 0);
  };
  const onPaste = (e, b) => {
    const t = e.clipboardData.getData('text');
    if (!/\n/.test(t.trim())) return;
    e.preventDefault();
    const pieces = blocksFromInput(t, true).split('\n\n').filter(Boolean);
    const first = b.text.trim() ? null : pieces.shift();
    if (first) upd(b.id, { text: first });
    setBlocks((bs) => {
      const i = bs.findIndex((x) => x.id === b.id), c = bs.slice();
      c.splice(i + 1, 0, ...pieces.map((p) => ({ id: nid(), text: p, size: b.size })));
      return c;
    });
  };

  /* ---- cover framing ---- */
  const drag = useRef(null);
  const down = (e) => {
    if (!adjusting) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = { sx: e.clientX, sy: e.clientY, x: cover.x, y: cover.y, w: r.width, h: r.height };
  };
  const moveDrag = (e) => {
    const g = drag.current;
    if (!g) return;
    setCover((c) => ({ ...c, x: clamp(g.x - ((e.clientX - g.sx) / g.w) * 100, 0, 100), y: clamp(g.y - ((e.clientY - g.sy) / g.h) * 100, 0, 100) }));
  };
  const resetFrame = () => setCover((c) => ({ ...c, x: 50, y: 50, zoom: 1 }));

  const publish = async () => {
    if (badDate(f.date)) { setErr(takenSet.has(f.date) ? 'A thread is already woven on that date. Pick a day with no thread.' : 'Pick a valid date: not in the future, and not a day that already has a thread.'); return; }
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/threads/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: f.title, date: f.date, theme: f.theme, motif: f.motif, size: f.size, body, quotes, editSlug: edit, eachLine: false, cover }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.status === 401) { router.replace('/admin/login/'); return; }
    if (!r.ok || !j.ok) { setErr(j.error || 'Could not save the thread.'); return; }
    try { localStorage.removeItem(key); } catch {}
    setDone(j);
    router.refresh();
  };

  if (done) {
    return (
      <div className="studio compose-done">
        <h1 className="about-title studio-title">{done.edited ? 'Thread updated.' : 'Woven in.'}</h1>
        <p className="about-lede">
          {done.edited ? 'Your changes are live.' : `It now sits in the cloth and in the ledger. The count reads ${done.total} ${done.total === 1 ? 'thread' : 'threads'}.`}
        </p>
        <p className="studio-cta" style={{ marginTop: '1.6rem' }}>
          <Link className="btn" href={`/threads/${done.slug}/`}>View the thread</Link>
          <ThreadsLink target="ledger" className="btn btn--ghost">See the ledger</ThreadsLink>
          <Link className="btn btn--ghost" href="/admin/">Back to Studio</Link>
          {!edit && <a className="btn btn--ghost" href="/admin/write/">Write another</a>}
        </p>
      </div>
    );
  }

  const bar = (
    <div className="compose-bar">
      <Link href="/admin/" className="back">Studio</Link>
      <span className="compose-state">{edit ? 'Editing a published thread' : 'New thread'} · {words} words</span>
      <div className="compose-bar-actions">
        <div className="seg" role="group" aria-label="View">
          <button type="button" className={mode === 'write' ? 'is-on' : ''} onClick={() => setMode('write')}>Write</button>
          <button type="button" className={mode === 'preview' ? 'is-on' : ''} onClick={() => setMode('preview')}>Preview</button>
        </div>
        <button type="button" className="btn" disabled={busy} onClick={publish}>{busy ? 'Weaving…' : edit ? 'Save changes' : 'Publish thread'}</button>
      </div>
      {err && <p className="cm-err compose-err" role="alert">{err}</p>}
    </div>
  );

  if (mode === 'preview') {
    return (
      <>
        {bar}
        <ThreadArticle thread={preview} total={edit ? total : total + 1} />
      </>
    );
  }

  return (
    <>
      {bar}
      <div className="thread compose" style={dyeVars}>
        <div className="thread-banner compose-banner" data-adjust={adjusting}>
          <Cover motif={f.motif} dye={cur.dye} cover={coverObj} />
          {adjusting && <div className="cover-drag" onPointerDown={down} onPointerMove={moveDrag} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)} />}
          <div className="compose-pick">
            <button type="button" className="btn" onClick={() => setPick(true)}>Change picture</button>
            <button type="button" className={'btn' + (adjusting ? '' : ' btn--ghost')} onClick={() => setAdjusting((v) => !v)} aria-pressed={adjusting}>{adjusting ? 'Done adjusting' : 'Adjust'}</button>
          </div>
          {adjusting && <p className="cover-hint">Drag the picture to reposition it</p>}
        </div>
        <div className="thread-fringe" aria-hidden="true" />

        {adjusting && (
          <div className="cover-panel">
            <label><span>Zoom</span><input type="range" min="1" max="3" step="0.05" value={cover.zoom} onChange={(e) => setCover((c) => ({ ...c, zoom: +e.target.value }))} /></label>
            <label><span>Left / right</span><input type="range" min="0" max="100" step="1" value={cover.x} onChange={(e) => setCover((c) => ({ ...c, x: +e.target.value }))} /></label>
            <label><span>Up / down</span><input type="range" min="0" max="100" step="1" value={cover.y} onChange={(e) => setCover((c) => ({ ...c, y: +e.target.value }))} /></label>
            <button type="button" className="btn btn--ghost" onClick={resetFrame}>Reset</button>
          </div>
        )}

        <header className="thread-head">
          <Auto className="thread-title compose-title" rows={1} value={f.title} onChange={(e) => set({ title: e.target.value.replace(/\n/g, ' ') })} placeholder="Title of the thread" maxLength={120} aria-label="Title" />
          <div className="compose-row">
            <div className="compose-field"><span>Date</span><DatePicker value={f.date} onChange={(d) => set({ date: d })} taken={takenSet} minDate={minDate} /></div>
            <div className="compose-field"><span>Theme (dye)</span>
              <div className="chips chips--tight" role="group" aria-label="Theme">
                {allThemes.map((t) => {
                  const p = paletteOf(t.dye);
                  const chip = (
                    <button type="button" className={'chip' + (f.theme === t.key ? ' is-on' : '')} aria-pressed={f.theme === t.key} onClick={() => set({ theme: t.key })} title={t.line}>
                      <i style={{ background: p.bg, boxShadow: `inset 0 0 0 3px ${p.c1}` }} />{t.name}
                    </button>
                  );
                  return t.builtin ? <span key={t.key} className="chip-wrap">{chip}</span> : (
                    <span key={t.key} className="chip-wrap chip-wrap--custom">
                      {chip}
                      <button type="button" className="chip-edit" aria-label={`Edit theme ${t.name}`} title="Edit this theme" onClick={() => setThemeDlg({ theme: t.theme })}>
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="M13.5 6.5l4 4" /></svg>
                      </button>
                    </span>
                  );
                })}
                <button type="button" className="chip chip--add" onClick={() => setThemeDlg({ theme: null })}>+ New theme</button>
              </div>
            </div>
            <div className="compose-field"><span>Base text size</span>
              <div className="seg" role="group" aria-label="Base text size">
                {[['small', 'Smaller'], ['regular', 'Regular'], ['large', 'Larger']].map(([v, l]) => (
                  <button type="button" key={v} className={f.size === v ? 'is-on' : ''} aria-pressed={f.size === v} onClick={() => set({ size: v })}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="thread-body" data-size={f.size}>
          {blocks.map((b, i) => (
            <div className="para compose-para" data-size={b.size} key={b.id}>
              <Auto
                ref={(el) => { if (el) refs.current[b.id] = el; else delete refs.current[b.id]; }}
                className="compose-text" value={b.text} rows={1}
                onChange={(e) => upd(b.id, { text: e.target.value })}
                onKeyDown={(e) => onKey(e, b, i)} onPaste={(e) => onPaste(e, b)}
                placeholder={i === 0 ? 'Start writing. Enter begins a new paragraph.' : 'Next paragraph'}
                aria-label={`Paragraph ${i + 1}`}
              />
              <div className="blk-tools" role="toolbar" aria-label={`Paragraph ${i + 1} options`}>
                <div className="seg seg--sm" role="group" aria-label="Paragraph size">
                  {PARA.map(([v, short, long]) => (
                    <button type="button" key={v} title={long} aria-label={long} aria-pressed={b.size === v} className={b.size === v ? 'is-on' : ''} onClick={() => upd(b.id, { size: v })}>{short}</button>
                  ))}
                </div>
                <span className="blk-gap" />
                <button type="button" className="cm-btn" onClick={() => move(b.id, -1)} disabled={i === 0} aria-label="Move up">Up</button>
                <button type="button" className="cm-btn" onClick={() => move(b.id, 1)} disabled={i === blocks.length - 1} aria-label="Move down">Down</button>
                <button type="button" className="cm-btn cm-del" onClick={() => remove(b)}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="add-para" onClick={() => insertAfter(blocks[blocks.length - 1].id, '', 'regular', 0)}>+ Add a paragraph</button>
          <p className="compose-hint">{words} words · about {Math.max(1, Math.round(words / 210))} min read · pick a size for each paragraph with the A buttons · start a line with “- ” for a list · long paragraphs are split into bite-sized lines automatically.</p>

          <figure className="closing">
            <blockquote><Auto className="compose-quote" rows={1} value={f.q1} onChange={(e) => set({ q1: e.target.value.replace(/\n/g, ' ') })} placeholder="Your closing line (becomes the image card)" maxLength={300} aria-label="Closing line" /></blockquote>
            <blockquote><Auto className="compose-quote" rows={1} value={f.q2} onChange={(e) => set({ q2: e.target.value.replace(/\n/g, ' ') })} placeholder="A second line (optional)" maxLength={300} aria-label="Second closing line" /></blockquote>
          </figure>

          <div className="sig-row">
            <p className="sig">
              <span className="sig-name">Harshith</span>
              <svg className="sig-flourish" viewBox="0 0 220 24" aria-hidden="true"><path d="M3 16 C 50 2, 100 22, 217 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
              <span className="sig-date">{f.date ? formatDate(f.date) : ''}</span>
            </p>
          </div>
        </div>

        {quotes.length > 0 ? (
          <QuoteCard slug={edit || 'draft'} title={f.title || 'Untitled thread'} quotes={quotes} dye={cur.dye} motif={f.motif} cover={coverObj} dateLabel={f.date ? formatDate(f.date, { day: 'numeric', month: 'short', year: 'numeric' }) : ''} />
        ) : (
          <p className="compose-hint compose-hint--center">Add a closing line above and its downloadable image card appears here.</p>
        )}
      </div>

      {pick && (
        <GalleryPicker
          motif={f.motif} dye={cur.dye} themeName={cur.name} coverId={cover.id}
          onPickArt={(m) => { set({ motif: m }); setCover({ id: null, x: 50, y: 50, zoom: 1 }); }}
          onPickImage={(id) => { setCover({ id, x: 50, y: 50, zoom: 1 }); setAdjusting(true); }}
          onClose={() => setPick(false)}
        />
      )}

      {themeDlg && (
        <ThemeDialog
          theme={themeDlg.theme}
          onClose={() => setThemeDlg(null)}
          onChange={(list, info) => {
            setCustoms(list);
            if (info.created) set({ theme: info.saved.id });
            if (info.removed && f.theme === info.removed.id) set({ theme: info.removed.moveTo });
            router.refresh();
          }}
        />
      )}
    </>
  );
}
