'use client';

import { useState } from 'react';

const TABS = [
  {
    id: 'warp',
    label: 'The warp',
    sub: 'what never moves',
    body: [
      'On a loom, the warp threads are strung first and they stay put. Everything woven afterwards is held up by them.',
      'The warp of this site is the handful of ideas that keep coming back in the writing: show up every day, hold your ground without hardening, choose dharma over convenience, and be at peace walking alone when the crowd is walking wrong.',
    ],
  },
  {
    id: 'weft',
    label: 'The weft',
    sub: 'what each day adds',
    body: [
      'The weft is the thread that crosses the warp, one pass at a time. On this site, one pass is one day of writing.',
      'A single pass looks like nothing. A month of passes is cloth. And cloth keeps honest records: skip a day and the gap stays visible, which is why the ledger on the home page counts every day, written or not.',
    ],
  },
];

export default function WarpWeft() {
  const [tab, setTab] = useState('warp');
  const cur = TABS.find((t) => t.id === tab);
  return (
    <div className="ww">
      <div className="ww-tabs" role="tablist" aria-label="Warp and weft">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={'ww-tab' + (tab === t.id ? ' is-on' : '')} onClick={() => setTab(t.id)}>
            <b>{t.label}</b>
            <span>{t.sub}</span>
          </button>
        ))}
      </div>
      <div className="ww-panel" role="tabpanel" key={tab}>
        <svg className="ww-art" viewBox="0 0 200 120" aria-hidden="true">
          {tab === 'warp'
            ? [20, 50, 80, 110, 140, 170].map((x) => <path key={x} d={`M${x} 6 V114`} stroke="var(--loom-warp)" strokeWidth="5" strokeLinecap="round" />)
            : [20, 44, 68, 92].map((y, k) => <path key={y} d={`M10 ${y} H${190 - k * 18}`} stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" />)}
          {tab === 'weft' && [20, 50, 80, 110, 140, 170].map((x) => <path key={x} d={`M${x} 6 V114`} stroke="var(--loom-warp)" strokeWidth="2" opacity=".5" />)}
        </svg>
        {cur.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div>
  );
}
