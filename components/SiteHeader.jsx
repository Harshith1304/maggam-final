import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import AdminNav from './AdminNav';
import BrandLink from './BrandLink';
import ThreadsLink from './ThreadsLink';

export const PORTFOLIO = process.env.NEXT_PUBLIC_PORTFOLIO_URL || '';

export function LoomMark({ size = 30 }) {
  return (
    <svg className="loom-mark" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <g stroke="var(--loom-warp)" strokeWidth="2.2" strokeLinecap="round"><path d="M6 3v26M13 3v26M20 3v26M27 3v26" /></g>
      <g stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"><path d="M2 9h8M16 9h8M9 16h8M23 16h8M2 23h8M16 23h8" /></g>
    </svg>
  );
}

export default function SiteHeader() {
  return (
    <header className="hdr">
      <div className="brand">
        <BrandLink>
          <LoomMark />
          <span className="brand-name">Maggam</span>
        </BrandLink>
        <Link href="/about/" className="brand-te" lang="te" aria-label="Why the name Maggam: the story">మగ్గం</Link>
      </div>
      <nav className="hdr-nav" aria-label="Main">
        <ThreadsLink>Threads</ThreadsLink>
        {PORTFOLIO ? <a href={PORTFOLIO} rel="noopener">Portfolio</a> : null}
        <AdminNav />
        <ThemeToggle />
      </nav>
    </header>
  );
}
