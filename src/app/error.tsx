"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="status-page">
      <div className="status-card">
        <p className="eyebrow">Something broke</p>
        <h1>We couldn&apos;t finish that.</h1>
        <p>The record is safe. Try the action again, or go back to a known page.</p>
        <div className="status-actions">
          <button className="button-primary" type="button" onClick={reset}>Try again <span>↗</span></button>
          <Link className="button-light" href="/">Go home</Link>
        </div>
      </div>
    </main>
  );
}
