'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/* A confirmation dialog that belongs to the site (same fonts, colours, buttons)
   instead of the browser's plain pop-up.   const confirm = useConfirm();  if (await confirm({...})) ... */
const Ctx = createContext(null);

export function ConfirmProvider({ children }) {
  const [opts, setOpts] = useState(null);
  const resolver = useRef(null);
  const okRef = useRef(null);
  const cancelRef = useRef(null);
  const lastFocus = useRef(null);

  const confirm = useCallback((o) => new Promise((resolve) => {
    lastFocus.current = document.activeElement;
    resolver.current = resolve;
    setOpts(o);
  }), []);

  const close = useCallback((value) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!opts) return;
    okRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Tab') {
        e.preventDefault();
        (document.activeElement === okRef.current ? cancelRef : okRef).current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [opts, close]);

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {opts && (
        <div className="dialog" onClick={() => close(false)}>
          <div className={'dialog-card' + (opts.danger ? ' is-danger' : '')} role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-m" onClick={(e) => e.stopPropagation()}>
            <h2 id="dlg-t" className="dialog-title">{opts.title}</h2>
            {opts.message && <p id="dlg-m" className="dialog-msg">{opts.message}</p>}
            <div className="dialog-actions">
              <button ref={cancelRef} type="button" className="btn btn--ghost" onClick={() => close(false)}>{opts.cancelLabel || 'Keep it'}</button>
              <button ref={okRef} type="button" className={'btn' + (opts.danger ? ' btn--danger' : '')} onClick={() => close(true)}>{opts.confirmLabel || 'Yes'}</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useConfirm = () => useContext(Ctx);
