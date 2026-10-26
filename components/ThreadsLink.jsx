'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/* A link to a section of the home page: "Threads" in the header, "All threads", "See the ledger"...
   On the home page it scrolls there every time it is pressed (a plain link does nothing the second time).
   From any other page it opens the home page and ScrollTopOnHome scrolls to the section once it exists
   (on a live site the page streams in, so the section is not there at the moment of the click). */
export default function ThreadsLink({ target = 'cloth', children, ...rest }) {
  const path = usePathname();
  const router = useRouter();
  const href = `/#${target}`;

  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let "open in new tab" work
    e.preventDefault();
    if (path === '/') {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', href);
      }
      return;
    }
    window.__maggamTarget = target;
    router.push('/');
  };

  return <Link href={href} onClick={onClick} {...rest}>{children}</Link>;
}
