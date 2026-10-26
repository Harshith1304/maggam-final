'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/login/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'Could not sign in.'); return; }
    router.replace('/admin/');
    router.refresh();
  };

  return (
    <div className="about wrap-n login">
      <h1 className="about-title">Studio</h1>
      <p className="about-lede">The loom room. Only the weaver goes in.</p>
      <form className="cm-form" onSubmit={submit} style={{ marginTop: '1.8rem', maxWidth: '26rem' }}>
        <label className="cm-field">
          <span>Password</span>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" autoFocus required />
        </label>
        <div className="cm-actions"><button className="btn" disabled={busy}>{busy ? 'Checking…' : 'Enter the studio'}</button></div>
        {err && <p className="cm-err" role="alert">{err}</p>}
      </form>
    </div>
  );
}
