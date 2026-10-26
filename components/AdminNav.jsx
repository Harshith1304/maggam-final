'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* Appears in the header only for the signed-in owner. Visitors never see it. */
export default function AdminNav() {
  const [s, setS] = useState(null);
  const path = usePathname();

  useEffect(() => {
    let alive = true;
    const go = () => fetch('/api/admin/me/', { cache: 'no-store' }).then((r) => r.json()).then((j) => alive && setS(j)).catch(() => {});
    go();
    const t = setInterval(go, 60000);
    return () => { alive = false; clearInterval(t); };
  }, [path]);

  if (!s?.admin) return null;
  return (
    <Link className="hdr-write" href="/admin/">
      Studio
      {s.unread > 0 && <b className="hdr-badge" aria-label={`${s.unread} new comments`}>{s.unread}</b>}
    </Link>
  );
}
