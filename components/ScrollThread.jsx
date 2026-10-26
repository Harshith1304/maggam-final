'use client';

import { useEffect, useRef } from 'react';

/* The page's scroll bar, drawn as a slim gold thread on the right edge.
   It floats over the page (no strip cut out of the layout), fades when idle, and can be dragged or clicked.
   The browser's own bar is only hidden once this one is running, and never on touch screens. */
export default function ScrollThread() {
  const track = useRef(null);
  const thumb = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches) return;
    root.classList.add('has-thread-scroll');

    let raf = 0, idle = 0, drag = null;
    const metrics = () => {
      const doc = Math.max(root.scrollHeight, 1), view = window.innerHeight;
      const h = track.current ? track.current.clientHeight : view;
      const thumbH = Math.max(46, (view / doc) * h);
      return { doc, view, h, thumbH, max: Math.max(h - thumbH, 1), scrollable: doc - view > 4 };
    };
    const paint = () => {
      raf = 0;
      const m = metrics();
      const el = thumb.current, tr = track.current;
      if (!el || !tr) return;
      tr.dataset.off = String(!m.scrollable);
      if (m.scrollable && m.h === 0) { raf = requestAnimationFrame(paint); return; } // the rail was hidden a moment ago; measure again once it shows
      const top = (window.scrollY / Math.max(m.doc - m.view, 1)) * m.max;
      el.style.height = m.thumbH + 'px';
      el.style.transform = `translateY(${Math.min(Math.max(top, 0), m.max)}px)`;
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(paint);
      const tr = track.current;
      if (!tr) return;
      tr.dataset.awake = 'true';
      clearTimeout(idle);
      idle = setTimeout(() => { if (!drag) tr.dataset.awake = 'false'; }, 1400);
    };

    const onDown = (e) => {
      const m = metrics();
      if (!m.scrollable) return;
      const tr = track.current, el = thumb.current;
      tr.setPointerCapture(e.pointerId);
      const rect = tr.getBoundingClientRect();
      const onThumb = el.contains(e.target);
      const thumbTop = (window.scrollY / Math.max(m.doc - m.view, 1)) * m.max;
      // pressing on empty track centres the thumb there; pressing the thumb keeps the grab point
      const grab = onThumb ? e.clientY - rect.top - thumbTop : m.thumbH / 2;
      drag = { grab };
      root.style.scrollBehavior = 'auto';
      tr.dataset.drag = 'true';
      const to = (y) => {
        const t = Math.min(Math.max(y - rect.top - drag.grab, 0), m.max);
        window.scrollTo(0, (t / m.max) * (m.doc - m.view));
      };
      to(e.clientY);
      drag.to = to;
      wake();
    };
    const onMove = (e) => { if (drag) drag.to(e.clientY); };
    const onUp = () => {
      if (!drag) return;
      drag = null;
      root.style.scrollBehavior = '';
      track.current.dataset.drag = 'false';
      wake();
    };

    const tr = track.current;
    tr.addEventListener('pointerdown', onDown);
    tr.addEventListener('pointermove', onMove);
    tr.addEventListener('pointerup', onUp);
    tr.addEventListener('pointercancel', onUp);
    tr.addEventListener('pointerenter', wake);
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    const ro = new ResizeObserver(wake);
    ro.observe(root);
    ro.observe(document.body);
    wake();

    return () => {
      root.classList.remove('has-thread-scroll');
      root.style.scrollBehavior = '';
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      ro.disconnect();
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
      tr.removeEventListener('pointerdown', onDown);
      tr.removeEventListener('pointermove', onMove);
      tr.removeEventListener('pointerup', onUp);
      tr.removeEventListener('pointercancel', onUp);
      tr.removeEventListener('pointerenter', wake);
    };
  }, []);

  return (
    <div className="sthread" ref={track} data-awake="false" aria-hidden="true">
      <span className="sthread-line" />
      <span className="sthread-thumb" ref={thumb} />
    </div>
  );
}
