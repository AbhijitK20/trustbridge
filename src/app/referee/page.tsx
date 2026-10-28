import type { Metadata } from "next";
import Link from "next/link";
import RefereeChat from "./referee-chat";
import LegalFooter from "@/components/legal-footer";
import InnerScene from "@/components/experience/inner-scene";

export const metadata: Metadata = {
  title: "TrustBridge | Talk to the referee",
  description: "Paste an offer. Get a four-state verdict, the conditions, and a reply you can send.",
};

export default function RefereePage() {
  return (
    <main className="referee-page">
      <nav className="topbar check-topbar">
        <Link className="brand" href="/" aria-label="TrustBridge home">
          <span className="brand-mark">T</span> trustbridge
        </Link>
        <div className="nav-links">
          <Link href="/check">Verify a claim</Link>
          <Link href="/referee">Referee chat</Link>
          <Link href="/demo/scam?preview=1">Extension demo</Link>
          <Link className="nav-ghost" href="/signin">Sign in</Link>
          <Link className="nav-cta" href="/create">Protect a deal <span>↗</span></Link>
        </div>
      </nav>

      <InnerScene mode="seal" className="referee-scene" />
      <header className="referee-hero">
        <p className="eyebrow"><span className="eyebrow-dot" /> The deal referee</p>
        <h1>Say it in chat.<br /><em>Check it in chat.</em></h1>
        <p>
          Paste the offer, the email, or the link. TrustBridge separates the claim from the evidence,
          names what it could not determine, and drafts the reply you can actually send.
        </p>
      </header>

      <div className="referee-shell">
        <RefereeChat />
      </div>

      <footer className="check-footer">
        <span>AI recommends. A human decides the dispute.</span>
        <span>Screenshots are claims, not evidence.</span>
      </footer>
      <LegalFooter />
    </main>
  );
}
