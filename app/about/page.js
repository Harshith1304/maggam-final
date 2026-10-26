import Link from 'next/link';
import WarpWeft from '@/components/WarpWeft';
import ThreadsLink from '@/components/ThreadsLink';
import { PORTFOLIO } from '@/components/SiteHeader';

export const metadata = {
  title: 'The name',
  description: 'Why this place is called Maggam: the story of a loom, a town, and a daily habit.',
};

export default function About() {
  return (
    <div className="about">
      <header className="about-head wrap-n">
        <h1 className="about-title">
          Maggam <span lang="te">మగ్గం</span>
        </h1>
        <p className="about-lede">The Telugu word for a loom, and the only name I could imagine for a place where I write every day.</p>
      </header>

      <section className="wrap-n about-sec">
        <h2 className="sec-title">The town, the machine</h2>
        <p>
          I live in Sircilla, a town in Telangana that the rest of the state associates with one thing: cloth. Looms are not a
          metaphor here. They are a trade, a daily sound, a craft that gets better only by repeating itself.
        </p>
        <p>
          I wanted my writing to feel like that. Not a mood that arrives on good days, but a seat I return to, a few threads at a
          time, whether or not the day feels worth it. So the site is built like cloth, and the name came before the colours did.
        </p>
      </section>

      <section className="wrap-n about-sec">
        <h2 className="sec-title">How the cloth is made</h2>
        <WarpWeft />
      </section>

      <section className="wrap-n about-sec">
        <h2 className="sec-title">The rules of the loom</h2>
        <ol className="rules">
          <li><b>One thread a day.</b> A short one counts. A missing one shows up as a gap in the ledger.</li>
          <li><b>No unpicking.</b> A weaver does not re-spin a thread once it is in the cloth. Spelling slips and rough edges stay as written.</li>
          <li><b>Date it, sign it.</b> Every thread carries the day it was woven and my name at the foot, bottom right.</li>
        </ol>
      </section>

      <section className="wrap-n about-sec about-end">
        <p className="about-sign" aria-label="Harshith"><span>Harshith</span></p>
        <div className="about-cta">
          <ThreadsLink className="btn">Read the threads</ThreadsLink>
          {PORTFOLIO ? <a className="btn btn--ghost" href={PORTFOLIO} rel="noopener">Back to my portfolio</a> : null}
        </div>
      </section>
    </div>
  );
}
