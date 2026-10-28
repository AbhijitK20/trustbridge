import type { Metadata } from "next";
import Link from "next/link";
import CheckForm from "./check-form";
import LegalFooter from "@/components/legal-footer";
import InnerScene from "@/components/experience/inner-scene";

export const metadata: Metadata = {
  title: "TrustBridge | Verify before you pay",
  description:
    "Check a claim, an offer, or a link against independent evidence. Four-state verdicts, evidence tiers, and a protected deal when verification is inconclusive.",
};

export default function CheckPage() {
  return (
    <main className="check-page">
      <nav className="topbar check-topbar">
        <Link className="brand" href="/" aria-label="TrustBridge home">
          <span className="brand-mark">T</span> trustbridge
        </Link>
        <div className="nav-links">
          <Link href="/check">Verify a claim</Link>
          <Link href="/referee">Referee chat</Link>
          <Link href="/demo/whatsapp">WhatsApp bot</Link>
          <Link href="/create">Create a deal</Link>
          <Link className="nav-ghost" href="/signin">Sign in</Link>
          <Link className="nav-cta" href="/create">Protect a deal <span>↗</span></Link>
        </div>
      </nav>

      <InnerScene mode="evidence" className="check-scene" />
      <header className="check-hero">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> Evidence before money</p>
          <h1>Check the claim <em>before</em> you pay.</h1>
        </div>
        <p className="check-hero-text">
          A screenshot proves a message exists. It does not prove the sender, the offer, or the fee.
          TrustBridge reads the promise, separates claims from evidence, and tells you what an independent source can actually support.
        </p>
      </header>

      <CheckForm />

      <footer className="check-footer">
        <span>Verification is unilateral. Protection is bilateral.</span>
        <span>Four outcomes. No fake certainty.</span>
      </footer>
      <LegalFooter />
    </main>
  );
}
