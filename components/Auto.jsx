'use client';

import { useEffect, useRef } from 'react';

/** A textarea that grows with what is typed, so writing feels like writing on the page itself. */
export default function Auto({ value, ref, ...rest }) {
  const inner = useRef(null);
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <textarea
      {...rest}
      value={value}
      ref={(el) => {
        inner.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
    />
  );
}
