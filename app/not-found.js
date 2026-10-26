import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="about wrap-n" style={{ paddingBlock: '18vh 10vh' }}>
      <h1 className="about-title">A dropped thread.</h1>
      <p className="about-lede">That page isn't on the loom. Let's get you back to the cloth.</p>
      <p style={{ marginTop: '1.6rem' }}><Link className="btn" href="/">Back to Maggam</Link></p>
    </div>
  );
}
