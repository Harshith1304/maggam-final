'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* "Maggam" always takes you to the very top (the hero), from any page or scroll position. */
export default function BrandLink({ children }) {
  const path = usePathname();
  const onClick = (e) => {
    if (path === '/') {
      e.preventDefault();
      window.history.replaceState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.__maggamTop = true; // ScrollTopOnHome finishes the job once the home page has opened
    }
  };
  return (
    <Link href="/" className="brand-home" onClick={onClick} aria-label="Maggam, back to the top">
      {children}
    </Link>
  );
}
