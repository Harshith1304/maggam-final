'use client';

import { useRouter } from 'next/navigation';

export default function PullThread({ slugs, className = 'btn btn--ghost', children = 'Pull a random thread' }) {
  const router = useRouter();
  const pull = () => router.push(`/threads/${slugs[Math.floor(Math.random() * slugs.length)]}/`);
  return (
    <button type="button" className={className} onClick={pull}>
      {children}
    </button>
  );
}
