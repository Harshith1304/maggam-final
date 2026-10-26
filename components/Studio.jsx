'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from './Comments';
import { formatDate } from '@/lib/text';
import { useConfirm } from './Confirm';
import ThemeDialog from './ThemeDialog';
import { CATEGORIES, paletteOf, dyeKeyForHex } from '@/lib/dyes';

async function post(url, body = {}) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ...(await r.json().catch(() => ({}))), status: r.status };
}
function ago(iso) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24); if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Studio() {
  const router = useRouter();
  const confirm = useConfirm();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('new');
  const [dlg, setDlg] = useState(null);
  const [openTheme, setOpenTheme] = useState(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/overview/', { cache: 'no-store' });
    if (r.status === 401) { router.replace('/admin/login/'); return; }
    setData(await r.json());
  }, [router]);
  useEffect(() => { load(); }, [load]);

  const del = async (c) => {
    const ok = await confirm({
      title: `Delete ${c.name}'s comment?`,
      message: c.parentId ? 'This reply will be removed from the thread for good.' : 'It will be removed from the thread for good, along with any replies under it.',
      confirmLabel: 'Delete', cancelLabel: 'Keep it', danger: true,
    });
    if (!ok) return;
    await post('/api/admin/comments/delete/', { id: c.id });
    load();
  };
  const read = async (ids) => { await post('/api/admin/comments/read/', ids === 'all' ? { all: true } : { ids }); load(); };
  const logout = async () => { await post('/api/admin/logout/'); router.replace('/'); router.refresh(); };

  if (!data) return <p className="studio-wait">Opening the studio…</p>;

  const isNew = (c) => !c.read && !c.author;
  const list = (tab === 'new' ? data.comments.filter(isNew) : data.comments).slice(0, 60);
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const wroteToday = data.threads.some((t) => t.date === todayISO);

  return (
    <div className="studio">
      <header className="studio-head">
        <div>
          <h1 className="about-title studio-title">Studio</h1>
          <p className="about-lede">Welcome back, Harshith. {wroteToday ? "Today's thread is already on the loom." : "Today's thread isn't woven yet."}</p>
        </div>
        <div className="studio-cta">
          <Link className="btn" href="/admin/write/">Write a new thread</Link>
          <button className="btn btn--ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      {data.storage?.missingDatabase && (
        <div className="studio-warn" role="alert">
          <b>The database is not connected yet.</b> Reading works, but publishing, comments, themes and photos cannot be saved. In Vercel open this project, go to Storage, connect an Upstash Redis database, then redeploy. You can check the connection at /api/status.
        </div>
      )}

      <ul className="stats">
        <li><b>{data.stats.threads}</b><span>threads</span></li>
        <li><b>{data.stats.comments}</b><span>comments</span></li>
        <li><b>{data.stats.likes}</b><span>likes on comments</span></li>
        <li className={data.unread ? 'hot' : ''}><b>{data.unread}</b><span>new to read</span></li>
      </ul>

      <section className="studio-sec" aria-labelledby="nt-h">
        <div className="studio-sec-head">
          <h2 id="nt-h" className="sec-title">Notifications</h2>
          <div className="studio-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'new'} className={'qtab' + (tab === 'new' ? ' is-on' : '')} onClick={() => setTab('new')}>New ({data.unread})</button>
            <button role="tab" aria-selected={tab === 'all'} className={'qtab' + (tab === 'all' ? ' is-on' : '')} onClick={() => setTab('all')}>All ({data.comments.length})</button>
            {data.unread > 0 && <button className="cm-btn" onClick={() => read('all')}>Mark all read</button>}
          </div>
        </div>

        {list.length === 0 ? (
          <p className="studio-empty">{tab === 'new' ? 'Nothing new. Every comment has been read.' : 'No comments yet.'}</p>
        ) : (
          <ul className="notes">
            {list.map((c) => (
              <li key={c.id} className={'note' + (isNew(c) ? ' is-new' : '')}>
                <Avatar name={c.name} />
                <div className="note-main">
                  <p className="note-top">
                    <b>{c.name}</b> {c.parentId ? 'replied' : 'commented'} on <Link href={`/threads/${c.slug}/#c-${c.id}`} onClick={() => isNew(c) && read([c.id])}>{c.threadTitle}</Link>
                    <time dateTime={c.createdAt}>{ago(c.createdAt)}</time>
                  </p>
                  <p className="note-msg">{c.message}</p>
                  <p className="note-act">
                    <Link className="cm-btn" href={`/threads/${c.slug}/#c-${c.id}`} onClick={() => isNew(c) && read([c.id])}>Open and reply</Link>
                    {isNew(c) && <button className="cm-btn" onClick={() => read([c.id])}>Mark read</button>}
                    <button className="cm-btn cm-del" onClick={() => del(c)}>Delete</button>
                    <span className="note-likes">{c.likes} {c.likes === 1 ? 'like' : 'likes'}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="studio-sec" aria-labelledby="tm-h">
        <div className="studio-sec-head">
          <h2 id="tm-h" className="sec-title">Your themes</h2>
          <button type="button" className="btn btn--ghost" onClick={() => setDlg({ theme: null })}>New theme</button>
        </div>
        <p className="studio-note">The four built-in themes are fixed. Themes you add can be renamed, recoloured or removed whenever you like.</p>
        <ul className="theme-list">
          {CATEGORIES.map((c) => (
            <li key={c.name} className="is-locked">
              <i style={{ background: paletteOf(c.dye).bg, boxShadow: `inset 0 0 0 3px ${paletteOf(c.dye).c1}` }} />
              <b>{c.name}</b>
              <svg className="theme-lock" viewBox="0 0 24 24" width="16" height="16" aria-label="Locked" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            </li>
          ))}
          {data.themes.map((t) => {
            const used = data.threads.filter((x) => x.themeId === t.id);
            const label = `${t.uses} ${t.uses === 1 ? 'thread' : 'threads'}`;
            return (
              <li key={t.id}>
                <i style={{ background: paletteOf(dyeKeyForHex(t.color)).bg, boxShadow: `inset 0 0 0 3px ${paletteOf(dyeKeyForHex(t.color)).c1}` }} />
                <b>{t.name}</b>
                {used.length === 1 ? (
                  <Link className="theme-link" href={`/threads/${used[0].slug}/`}>{label}</Link>
                ) : used.length > 1 ? (
                  <button type="button" className="theme-link" aria-expanded={openTheme === t.id} onClick={() => setOpenTheme(openTheme === t.id ? null : t.id)}>{label}</button>
                ) : (
                  <span className="theme-meta">{label}</span>
                )}
                <button type="button" className="cm-btn theme-edit" onClick={() => setDlg({ theme: t })}>Edit</button>
                <button type="button" className="cm-btn cm-del" onClick={() => setDlg({ theme: t, removing: true })}>Remove</button>
                {openTheme === t.id && used.length > 1 && (
                  <div className="theme-uses">
                    {used.map((x) => <Link key={x.slug} href={`/threads/${x.slug}/`}>{x.title}</Link>)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {data.themes.length === 0 && <p className="studio-empty">No custom themes yet. Add one and it appears in the composer next to the built-in four.</p>}
      </section>

      <section className="studio-sec" aria-labelledby="th-h">
        <h2 id="th-h" className="sec-title">Your threads</h2>
        <ul className="trows">
          {data.threads.map((t) => (
            <li key={t.slug}>
              <span className="trow-no">No. {t.number}</span>
              <Link className="trow-title" href={`/threads/${t.slug}/`}>{t.title}</Link>
              <span className="trow-meta">{formatDate(t.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {t.comments} {t.comments === 1 ? 'comment' : 'comments'}</span>
              <Link className="cm-btn" href={`/admin/write/?edit=${t.slug}`}>Edit</Link>
            </li>
          ))}
        </ul>
      </section>
      {dlg && <ThemeDialog theme={dlg.theme} startRemoving={!!dlg.removing} onClose={() => setDlg(null)} onChange={() => load()} />}
    </div>
  );
}
