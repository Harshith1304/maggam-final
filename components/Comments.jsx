'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DYES } from '@/lib/dyes';
import { useConfirm } from './Confirm';

const KEYS = ['indigo', 'madder', 'myrobalan', 'turmeric'];
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ...j, ok: r.ok && j.ok !== false };
}

function ago(iso) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24); if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Avatar({ name }) {
  const d = DYES[KEYS[hash(name) % 4]];
  return (
    <span className="avatar" aria-hidden="true" style={{ background: d.bg, boxShadow: `inset 0 0 0 3px ${d.c1}`, color: KEYS[hash(name) % 4] === 'turmeric' ? d.ink : d.c3 }}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

function Form({ slug, parentId = null, replyTo = null, isAdmin, onDone, onCancel }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { try { setName(localStorage.getItem('maggam-name') || ''); } catch {} }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await post('/api/comments/', { slug, parentId, name, message, website: trap });
    setBusy(false);
    if (!r.ok) { setErr(r.error || 'Could not post that. Please try again.'); return; }
    try { if (!isAdmin) localStorage.setItem('maggam-name', name); } catch {}
    setMessage('');
    onDone(r.comment);
  };

  return (
    <form className={'cm-form' + (parentId ? ' cm-form--reply' : '')} onSubmit={submit}>
      {!isAdmin && (
        <label className="cm-field">
          <span>Your name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required placeholder="How should I address you?" autoComplete="nickname" />
        </label>
      )}
      <label className="cm-field">
        <span>{parentId ? `Reply to ${replyTo}` : isAdmin ? 'Write as Harshith' : 'Your thought'}</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} required rows={parentId ? 3 : 4} placeholder={parentId ? 'Write a reply' : 'What did this thread stir in you?'} />
      </label>
      <input className="cm-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={trap} onChange={(e) => setTrap(e.target.value)} />
      <div className="cm-actions">
        <button className="btn" disabled={busy}>{busy ? 'Posting…' : parentId ? 'Post reply' : 'Post comment'}</button>
        {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>}
        <span className="cm-count">{message.length}/1000</span>
      </div>
      {err && <p className="cm-err" role="alert">{err}</p>}
    </form>
  );
}

function Item({ c, replies, isAdmin, slug, onChange, onLike, onDelete, depth = 0 }) {
  const [replying, setReplying] = useState(false);
  return (
    <article className={'cm' + (c.author ? ' cm--author' : '') + (depth ? ' cm--reply' : '')} id={'c-' + c.id}>
      <Avatar name={c.name} />
      <div className="cm-main">
        <header className="cm-head">
          <b>{c.name}</b>
          {c.author && <span className="cm-badge">Author</span>}
          <time dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString()}>{ago(c.createdAt)}</time>
        </header>
        {c.replyTo && depth > 0 && <p className="cm-to">replying to {c.replyTo}</p>}
        <p className="cm-text">{c.message}</p>
        <footer className="cm-foot">
          <button type="button" className={'cm-btn cm-like' + (c.liked ? ' is-on' : '')} onClick={() => onLike(c)} aria-pressed={c.liked} aria-label={c.liked ? 'Remove your like' : 'Like this comment'}>
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6 5c2 0 3.4 1.1 4.1 2.3L12 9.8l1.9-2.5C14.6 6.1 16 5 18 5c3.3 0 5.1 3.4 3.6 6.8C19.5 16.4 12 21 12 21Z" fill={c.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            <span>{c.likes}</span>
          </button>
          <button type="button" className="cm-btn" onClick={() => setReplying((v) => !v)}>Reply</button>
          {isAdmin && <button type="button" className="cm-btn cm-del" onClick={() => onDelete(c, replies.length)}>Delete</button>}
        </footer>
        {replying && (
          <Form slug={slug} parentId={c.id} replyTo={c.name} isAdmin={isAdmin} onCancel={() => setReplying(false)} onDone={() => { setReplying(false); onChange(); }} />
        )}
        {replies.length > 0 && (
          <div className="cm-replies">
            {replies.map((r) => (
              <Item key={r.id} c={r} replies={[]} isAdmin={isAdmin} slug={slug} onChange={onChange} onLike={onLike} onDelete={onDelete} depth={1} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function Comments({ slug }) {
  const confirm = useConfirm();
  const [state, setState] = useState({ loading: true, comments: [], isAdmin: false, failed: false });

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/comments/?slug=' + encodeURIComponent(slug), { cache: 'no-store' });
      const j = await r.json();
      setState({ loading: false, comments: j.comments || [], isAdmin: !!j.isAdmin, failed: !r.ok });
    } catch {
      setState((s) => ({ ...s, loading: false, failed: true }));
    }
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  const { roots, byParent } = useMemo(() => {
    const roots = state.comments.filter((c) => !c.parentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const byParent = {};
    state.comments.filter((c) => c.parentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((c) => (byParent[c.parentId] ||= []).push(c));
    return { roots, byParent };
  }, [state.comments]);

  const like = async (c) => {
    const flip = (liked, likes) => setState((s) => ({ ...s, comments: s.comments.map((x) => (x.id === c.id ? { ...x, liked, likes } : x)) }));
    flip(!c.liked, c.likes + (c.liked ? -1 : 1));
    const r = await post('/api/comments/like/', { id: c.id });
    if (!r.ok) flip(c.liked, c.likes); else flip(r.liked, r.likes);
  };
  const del = async (c, n) => {
    const ok = await confirm({
      title: n ? 'Delete this comment and its replies?' : 'Delete this comment?',
      message: `${c.name}'s words will be removed from the thread for good.${n ? ` ${n} ${n === 1 ? 'reply' : 'replies'} under it will go too.` : ''}`,
      confirmLabel: 'Delete', cancelLabel: 'Keep it', danger: true,
    });
    if (!ok) return;
    const r = await post('/api/admin/comments/delete/', { id: c.id });
    if (r.ok) load();
  };

  return (
    <section className="comments" id="comments" aria-labelledby="cm-h">
      <h2 id="cm-h" className="sec-title">Leave a thought</h2>
      <p className="cm-intro">No account needed. Say what this stirred in you. Be kind, be specific.</p>
      <Form slug={slug} isAdmin={state.isAdmin} onDone={() => load()} />

      <h3 className="cm-total">
        {state.loading ? 'Loading the conversation…' : state.comments.length ? `${state.comments.length} ${state.comments.length === 1 ? 'thought' : 'thoughts'} so far` : 'No thoughts yet. Be the first.'}
      </h3>
      {state.failed && !state.loading && <p className="cm-err">The conversation could not be loaded right now.</p>}
      <div className="cm-list">
        {roots.map((c) => (
          <Item key={c.id} c={c} replies={byParent[c.id] || []} isAdmin={state.isAdmin} slug={slug} onChange={load} onLike={like} onDelete={del} />
        ))}
      </div>
    </section>
  );
}
