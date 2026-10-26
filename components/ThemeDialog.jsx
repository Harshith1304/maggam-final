'use client';

import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, paletteOf, paletteFrom, hexToHsl, hslToHex, dyeKeyForHex } from '@/lib/dyes';
import { sceneSVG } from '@/lib/art';

const SWATCHES = ['#e63946', '#d6336c', '#e75480', '#b5179e', '#7b2cbf', '#5a4fcf', '#3a6ea5', '#2b83d6', '#0096c7', '#00a6a6', '#1b9e77', '#2e8b57',
  '#4c9a2a', '#8ab017', '#c9b300', '#e0a800', '#f08c00', '#e8590c', '#c0392b', '#8d5524', '#6b705c', '#495057', '#1d3557', '#370617'];
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const fit = ({ h, s, l }) => ({ h, s: clamp(s, 25, 100), l: clamp(l, 22, 72) });

/* Create, edit or remove one of YOUR themes. The four built-in themes never reach this dialog.
   theme = null  -> new theme;   theme = {id, name, color, uses} -> edit (or remove when startRemoving). */
export default function ThemeDialog({ theme, startRemoving = false, onClose, onChange }) {
  const [name, setName] = useState(theme?.name || '');
  const [hsl, setHsl] = useState(() => fit(hexToHsl(theme?.color || SWATCHES[2])));
  const [hexText, setHexText] = useState(() => hslToHex(...Object.values(fit(hexToHsl(theme?.color || SWATCHES[2])))));
  const [removing, setRemoving] = useState(startRemoving);
  const [moveTo, setMoveTo] = useState('Discipline');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nameRef = useRef(null);

  const hex = hslToHex(hsl.h, hsl.s, hsl.l);
  const pal = paletteFrom(hex);
  const apply = (next) => { const f = fit(next); setHsl(f); setHexText(hslToHex(f.h, f.s, f.l)); };

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const send = async (payload) => {
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/themes/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.status === 401) { window.location.href = '/admin/login/'; return null; }
    if (!r.ok || !j.ok) { setErr(j.error || 'That did not go through. Please try again.'); return null; }
    return j;
  };
  const save = async () => {
    const j = await send(theme ? { action: 'update', id: theme.id, name, color: hex } : { action: 'create', name, color: hex });
    if (j) { onChange(j.themes, { saved: j.theme, created: !theme }); onClose(); }
  };
  const remove = async () => {
    const j = await send({ action: 'delete', id: theme.id, moveTo });
    if (j) { onChange(j.themes, { removed: { id: theme.id, moveTo } }); onClose(); }
  };

  const onHexInput = (v) => {
    setHexText(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setHsl(fit(hexToHsl(v)));
  };

  return (
    <div className="dialog" onClick={onClose}>
      <div className="dialog-card dialog-card--wide" role="dialog" aria-modal="true" aria-labelledby="tm-title" onClick={(e) => e.stopPropagation()}>
        {removing ? (
          <>
            <h2 id="tm-title" className="dialog-title">Remove “{theme.name}”?</h2>
            {theme.uses > 0 ? (
              <>
                <p className="dialog-msg">{theme.uses} {theme.uses === 1 ? 'thread uses' : 'threads use'} this theme. Choose a built-in theme to move {theme.uses === 1 ? 'it' : 'them'} to. Nothing else about {theme.uses === 1 ? 'it' : 'them'} changes.</p>
                <div className="chips tm-move" role="group" aria-label="Move threads to">
                  {CATEGORIES.map((c) => (
                    <button type="button" key={c.name} className={'chip' + (moveTo === c.name ? ' is-on' : '')} aria-pressed={moveTo === c.name} onClick={() => setMoveTo(c.name)}>
                      <i style={{ background: paletteOf(c.dye).bg, boxShadow: `inset 0 0 0 3px ${paletteOf(c.dye).c1}` }} />{c.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="dialog-msg">No thread uses this theme, so nothing else changes.</p>
            )}
            {err && <p className="cm-err" role="alert">{err}</p>}
            <div className="dialog-actions">
              <button type="button" className="btn btn--ghost" onClick={() => (startRemoving ? onClose() : setRemoving(false))} disabled={busy}>Keep it</button>
              <button type="button" className="btn btn--danger" onClick={remove} disabled={busy}>{busy ? 'Removing…' : 'Remove theme'}</button>
            </div>
          </>
        ) : (
          <>
            <h2 id="tm-title" className="dialog-title">{theme ? 'Edit theme' : 'New theme'}</h2>
            <p className="dialog-msg tm-lead">Name it, pick its colour. Covers, cards and the dot on its button all follow that colour, just like the built-in themes.</p>

            <div className="tm-grid">
              <div className="tm-controls">
                <label className="cm-field">
                  <span>Theme name</span>
                  <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="For example: Gratitude" />
                </label>

                <div className="tm-block">
                  <span className="tm-label">Quick colours</span>
                  <div className="tm-swatches" role="group" aria-label="Quick colours">
                    {SWATCHES.map((c) => (
                      <button type="button" key={c} className={'tm-sw' + (c === hex ? ' is-on' : '')} style={{ background: c }} aria-label={`Use ${c}`} aria-pressed={c === hex} onClick={() => apply(hexToHsl(c))} />
                    ))}
                  </div>
                </div>

                <div className="tm-block">
                  <span className="tm-label">Or slide to your own</span>
                  <label className="tm-slider"><span>Colour</span>
                    <input type="range" min="0" max="360" value={hsl.h} className="rng rng--hue" onChange={(e) => apply({ ...hsl, h: +e.target.value })} aria-label="Colour" />
                  </label>
                  <label className="tm-slider"><span>Richness</span>
                    <input type="range" min="25" max="100" value={hsl.s} className="rng" style={{ '--track': `linear-gradient(90deg, hsl(${hsl.h} 25% ${hsl.l}%), hsl(${hsl.h} 100% ${hsl.l}%))` }} onChange={(e) => apply({ ...hsl, s: +e.target.value })} aria-label="Richness" />
                  </label>
                  <label className="tm-slider"><span>Brightness</span>
                    <input type="range" min="22" max="72" value={hsl.l} className="rng" style={{ '--track': `linear-gradient(90deg, hsl(${hsl.h} ${hsl.s}% 22%), hsl(${hsl.h} ${hsl.s}% 72%))` }} onChange={(e) => apply({ ...hsl, l: +e.target.value })} aria-label="Brightness" />
                  </label>
                  <label className="tm-hex"><span>Colour code</span>
                    <input value={hexText} onChange={(e) => onHexInput(e.target.value)} maxLength={7} spellCheck={false} aria-label="Colour code" />
                  </label>
                </div>
              </div>

              <div className="tm-side">
                <span className="tm-label">Preview</span>
                <div className="tm-preview" style={{ background: pal.bg, color: pal.fg }}>
                  <div className="tm-art" dangerouslySetInnerHTML={{ __html: sceneSVG('road', dyeKeyForHex(hex), 'tm') }} />
                  <div className="tm-sample">
                    <p style={{ color: pal.c2 }}>No. 22 · 10 Oct 2026</p>
                    <h3>{name.trim() || 'Your theme name'}</h3>
                    <p>A thread in this dye reads like this, clear and calm.</p>
                  </div>
                </div>
                <span className="chip tm-chip" aria-hidden="true">
                  <i style={{ background: pal.bg, boxShadow: `inset 0 0 0 3px ${pal.c1}` }} />{name.trim() || 'Your theme name'}
                </span>
              </div>
            </div>

            {err && <p className="cm-err" role="alert">{err}</p>}
            <div className="dialog-actions tm-actions">
              {theme && <button type="button" className="btn btn--ghost tm-remove" onClick={() => setRemoving(true)} disabled={busy}>Remove theme</button>}
              <span className="tm-spacer" />
              <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="button" className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : theme ? 'Save changes' : 'Create theme'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
