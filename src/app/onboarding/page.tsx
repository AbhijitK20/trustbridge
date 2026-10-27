"use client";

import { useState } from "react";
import Link from "next/link";

export default function OnboardingPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function start() {
    setPending(true); setError("");
    const response = await fetch("/api/connect/onboarding", { method: "POST" });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? "Onboarding could not start."); setPending(false); return; }
    window.location.assign(body.url);
  }
  return <main className="form-page"><div className="form-intro"><Link className="brand" href="/"><span className="brand-mark">T</span> trustbridge</Link><p className="eyebrow">Seller setup</p><h1>Get paid<br /><em>properly.</em></h1><p>Connect a verified Stripe account so TrustBridge can release your money after the buyer confirms delivery.</p></div><div className="deal-form auth-card"><p className="workflow-title">Stripe Connect onboarding</p><p className="public-description">Stripe handles identity verification and payout details. TrustBridge never stores your bank information.</p><button className="button-primary form-submit" onClick={start} disabled={pending}>{pending ? "Opening Stripe…" : "Connect Stripe account ↗"}</button>{error && <p className="form-error">{error}</p>}<p className="form-footnote">You will complete verification on Stripe&apos;s secure website.</p></div></main>;
}
