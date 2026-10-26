'use client';

import { useEffect, useRef, useState } from 'react';
import { paletteOf } from '@/lib/dyes';
import { sceneSVG } from '@/lib/art';

const CW = 1080, CH = 1350;

function wrap(ctx, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

async function loadCover({ cover, motif, dye }) {
  let url, revoke = false;
  if (cover?.src) url = cover.src;
  else {
    const svg = sceneSVG(motif, dye, 'card').replace('<svg ', '<svg width="800" height="500" ');
    url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    revoke = true;
  }
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally { if (revoke) URL.revokeObjectURL(url); }
}

// Same framing as the page: cover-fit, then position, then zoom about that point.
function drawCover(ctx, img, dx, dy, dw, dh, { x = 50, y = 50, zoom = 1 } = {}) {
  const iw = img.naturalWidth || 800, ih = img.naturalHeight || 500;
  const s = Math.max(dw / iw, dh / ih);
  const w0 = iw * s, h0 = ih * s;
  const ox = ((dw - w0) * x) / 100, oy = ((dh - h0) * y) / 100;
  const Ox = (dw * x) / 100, Oy = (dh * y) / 100;
  ctx.save();
  ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip();
  ctx.drawImage(img, dx + Ox + zoom * (ox - Ox), dy + Oy + zoom * (oy - Oy), w0 * zoom, h0 * zoom);
  ctx.restore();
}

async function paint(canvas, { quote, title, dye, motif, dateLabel, cover }) {
  await Promise.all([
    document.fonts.load('800 64px "Bricolage Grotesque Variable"'),
    document.fonts.load('600 30px "Bricolage Grotesque Variable"'),
    document.fonts.load('120px "Mrs Saint Delafield"'),
  ]).catch(() => {});
  const p = paletteOf(dye);
  const ctx = canvas.getContext('2d');
  canvas.width = CW; canvas.height = CH;
  ctx.fillStyle = p.bg; ctx.fillRect(0, 0, CW, CH);

  // cover picture (your photo or the illustration)
  const img = await loadCover({ cover, motif, dye });
  drawCover(ctx, img, 0, 0, CW, 650, cover);
  const g = ctx.createLinearGradient(0, 470, 0, 650);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, p.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 450, CW, 210);
  ctx.fillStyle = p.bg; ctx.fillRect(0, 650, CW, CH - 650);

  // quote
  const fg = p.fg;
  ctx.fillStyle = p.c2; ctx.font = '800 240px "Bricolage Grotesque Variable", serif'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('\u201C', 70, 790);
  const text = quote;
  let size = 84, lines;
  const maxW = CW - 180;
  for (; size >= 40; size -= 4) {
    ctx.font = `800 ${size}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
    lines = wrap(ctx, text, maxW);
    if (lines.length * size * 1.08 <= 440) break;
  }
  ctx.fillStyle = fg;
  lines.forEach((l, i) => ctx.fillText(l, 90, 800 + i * size * 1.08 + size * 0.7));

  // footer
  ctx.fillStyle = fg; ctx.globalAlpha = 0.8;
  ctx.font = '600 30px "Bricolage Grotesque Variable", system-ui, sans-serif';
  const t = title.length > 34 ? title.slice(0, 33) + '\u2026' : title;
  ctx.fillText(t, 90, CH - 120);
  ctx.globalAlpha = 0.55; ctx.font = '500 26px "Bricolage Grotesque Variable", system-ui, sans-serif';
  ctx.fillText(`${dateLabel}  \u00B7  Maggam`, 90, CH - 76);
  ctx.globalAlpha = 1;
  ctx.fillStyle = p.c2; ctx.font = '150px "Mrs Saint Delafield", cursive'; ctx.textAlign = 'right';
  ctx.fillText('Harshith', CW - 80, CH - 70);
  ctx.textAlign = 'left';

  // woven texture
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = 0; y < CH; y += 5) ctx.fillRect(0, y, CW, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  for (let x = 0; x < CW; x += 5) ctx.fillRect(x, 0, 1, CH);
}

export default function QuoteCard({ slug, title, quotes, dye, motif, dateLabel, cover }) {
  const canvas = useRef(null);
  const [i, setI] = useState(0);
  const [note, setNote] = useState('');
  const coverKey = JSON.stringify(cover || null);

  useEffect(() => {
    let off = false;
    paint(canvas.current, { quote: quotes[i], title, dye, motif, dateLabel, cover }).catch(() => { if (!off) setNote('Could not draw the card in this browser.'); });
    return () => { off = true; };
  }, [i, quotes, title, dye, motif, dateLabel, coverKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const download = () => {
    canvas.current.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = `maggam-${slug}${quotes.length > 1 ? '-' + (i + 1) : ''}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  };
  const share = async () => {
    const url = window.location.href;
    try {
      const blob = await new Promise((res) => canvas.current.toBlob(res, 'image/png'));
      if (blob && navigator.canShare) {
        const file = new File([blob], `maggam-${slug}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title, text: quotes[i], url }); return; }
      }
      if (navigator.share) { await navigator.share({ title, text: quotes[i], url }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); setNote('Link copied.'); } catch { setNote(url); }
    setTimeout(() => setNote(''), 2600);
  };

  return (
    <section className="qcard" aria-labelledby="qc-h">
      <div className="qcard-img"><canvas ref={canvas} role="img" aria-label={`Quote card: ${quotes[i]}`} /></div>
      <div className="qcard-side">
        <h2 id="qc-h" className="sec-title">Carry this thread</h2>
        <p>The line from this piece, set as a card. Save it, post it, pin it above your desk.</p>
        {quotes.length > 1 && (
          <div className="qtabs" role="tablist" aria-label="Choose a line">
            {quotes.map((_, k) => (
              <button key={k} role="tab" aria-selected={k === i} className={'qtab' + (k === i ? ' is-on' : '')} onClick={() => setI(k)}>Line {k + 1}</button>
            ))}
          </div>
        )}
        <div className="qcard-actions">
          <button className="btn" onClick={download}>Download PNG</button>
          <button className="btn btn--ghost" onClick={share}>Share</button>
        </div>
        <p className="qcard-note" aria-live="polite">{note}</p>
      </div>
    </section>
  );
}
