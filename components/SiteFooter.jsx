import { PORTFOLIO } from './SiteHeader';

export default function SiteFooter() {
  return (
    <footer className="ftr">
      <div className="ftr-in">
        <div>
          <p className="ftr-brand">Maggam <span lang="te">మగ్గం</span></p>
          <p className="ftr-copy">Every thread here is left exactly as it was written. Spelling slips, rough edges and all, because that is how the cloth was woven.</p>
          {PORTFOLIO ? (
            <p className="ftr-links">
              <a href={PORTFOLIO} rel="noopener">Back to portfolio</a>
            </p>
          ) : null}
        </div>
        <p className="ftr-sign" aria-label="Signed, Harshith"><span>Harshith</span></p>
      </div>
    </footer>
  );
}
