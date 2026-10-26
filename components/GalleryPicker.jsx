'use client';

import { useEffect, useRef, useState } from 'react';
import { sceneSVG, MOTIF_LIST } from '@/lib/art';
import { prepareImage } from '@/lib/imageprep';

export default function GalleryPicker({ motif, dye, themeName, coverId, onPickArt, onPickImage, onClose }) {
  const [tab, setTab] = useState(coverId ? 'photos' : 'art');
  const [photos, setPhotos] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  useEffect(() => {
    if (tab !== 'photos' || photos) return;
    fetch('/api/admin/upload/', { cache: 'no-store' }).then((r) => r.json()).then((j) => setPhotos(j.images || [])).catch(() => setPhotos([]));
  }, [tab, photos]);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const ready = await prepareImage(file);
      const fd = new FormData();
      fd.append('file', ready);
      const r = await fetch('/api/admin/upload/', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'The upload did not go through.');
      onPickImage(j.id);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="gallery" role="dialog" aria-modal="true" aria-label="Choose a cover picture" onClick={onClose}>
      <div className="gallery-in" onClick={(e) => e.stopPropagation()}>
        <header className="gallery-head">
          <div>
            <h2 className="sec-title">Choose the cover picture</h2>
            <p>Pick one of the thirty illustrations (shown in this thread's {themeName} dye) or use a photo from your own files.</p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Close</button>
        </header>

        <div className="seg gallery-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'art'} className={tab === 'art' ? 'is-on' : ''} onClick={() => setTab('art')}>Illustrations</button>
          <button role="tab" aria-selected={tab === 'photos'} className={tab === 'photos' ? 'is-on' : ''} onClick={() => setTab('photos')}>My photos</button>
        </div>

        {tab === 'art' ? (
          <div className="gallery-grid">
            {MOTIF_LIST.map(([id, label]) => (
              <button type="button" key={id} className={'gal' + (!coverId && id === motif ? ' is-on' : '')} onClick={() => { onPickArt(id); onClose(); }} aria-pressed={!coverId && id === motif}>
                <span className="gal-art" dangerouslySetInnerHTML={{ __html: sceneSVG(id, dye, 'gal-' + id) }} />
                <span className="gal-name">{label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="gallery-grid">
            <button type="button" className="gal gal-upload" onClick={() => fileRef.current?.click()} disabled={busy}>
              <span className="gal-art gal-plus"><b>{busy ? '…' : '+'}</b></span>
              <span className="gal-name">{busy ? 'Uploading…' : 'Upload from my files'}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => upload(e.target.files?.[0])} />
            {(photos || []).map((p) => (
              <button type="button" key={p.id} className={'gal' + (p.id === coverId ? ' is-on' : '')} onClick={() => { onPickImage(p.id); onClose(); }} aria-pressed={p.id === coverId}>
                <span className="gal-art"><img src={p.url} alt="" loading="lazy" /></span>
                <span className="gal-name">Uploaded photo</span>
              </button>
            ))}
            {photos && photos.length === 0 && <p className="gal-empty">No photos yet. Upload one and it is kept here for next time.</p>}
          </div>
        )}
        {err && <p className="cm-err" role="alert" style={{ marginTop: '1rem' }}>{err}</p>}
      </div>
    </div>
  );
}
