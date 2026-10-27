import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="status-page">
      <div className="status-card">
        <p className="eyebrow">404 · Not found</p>
        <h1>That page isn&apos;t here.</h1>
        <p>The deal link may be wrong, expired, or never existed. Check the link before you pay.</p>
        <div className="status-actions">
          <Link className="button-primary" href="/check">Check a claim <span>↗</span></Link>
          <Link className="button-light" href="/">Go home</Link>
        </div>
      </div>
    </main>
  );
}
