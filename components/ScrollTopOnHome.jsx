'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* After the home page opens:
   - from "Maggam" in the header: land on the very top (the hero);
   - from a link to a section (Threads, All threads, See the ledger) or an address ending in #cloth:
     wait until that section exists, then scroll to it. */
export default function ScrollTopOnHome() {
  const path = usePathname();

  useEffect(() => {
    if (path !== '/') return;

    if (window.__maggamTop) {
      window.__maggamTop = false;
      window.__maggamTarget = '';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }

    const id = window.__maggamTarget || (window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : '');
    window.__maggamTarget = '';
    if (!id) return;

    let tries = 0, raf = 0;
    const seek = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.location.hash !== '#' + id) window.history.replaceState(null, '', '/#' + id);
        return;
      }
      if (++tries < 300) raf = requestAnimationFrame(seek); // keep looking for about 5 seconds while the page streams in
    };
    seek();
    return () => cancelAnimationFrame(raf);
  }, [path]);

  return null;
}
