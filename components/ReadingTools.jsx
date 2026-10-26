'use client';

import { useEffect, useRef, useState } from 'react';

export default function ReadingTools() {
  const [focus, setFocus] = useState(false);
  const rail = useRef(null);

  useEffect(() => {
    const body = document.querySelector('.thread-body');
    if (!body) return;
    const onScroll = () => {
      const r = body.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight * 0.4);
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.35 - r.top) / total));
      rail.current?.style.setProperty('--p', p.toFixed(4));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const body = document.querySelector('.thread-body');
    if (!body) return;
    body.dataset.focus = String(focus);
    if (!focus) return;
    const items = [...body.querySelectorAll('.beat, .para li')];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-active', e.isIntersecting)),
      { rootMargin: '-36% 0px -36% 0px' }
    );
    items.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      items.forEach((el) => el.classList.remove('is-active'));
    };
  }, [focus]);

  return (
    <>
      <div className="rail" ref={rail} aria-hidden="true"><i /><b /></div>
      <button type="button" className="focus-btn" aria-pressed={focus} onClick={() => setFocus((f) => !f)}>
        <span aria-hidden="true" className="focus-dot" />
        {focus ? 'Focus on' : 'Focus line by line'}
      </button>
    </>
  );
}
