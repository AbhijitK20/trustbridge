import type { Metadata } from "next";
import Link from "next/link";
import WhatsAppSimulator from "./whatsapp-chat";
import LegalFooter from "@/components/legal-footer";

export const metadata: Metadata = {
  title: "TrustBridge | WhatsApp referee",
  description: "Check an offer inside a WhatsApp-style chat. The production bot uses the Meta Cloud API webhook.",
};

export default function WhatsAppDemoPage() {
  return (
    <main className="wa-page">
      <nav className="topbar check-topbar">
        <Link className="brand" href="/"><span className="brand-mark">T</span> trustbridge</Link>
        <div className="nav-links">
          <Link href="/check">Verify a claim</Link>
          <Link href="/referee">Referee chat</Link>
          <Link href="/demo/scam">Extension demo</Link>
          <Link className="nav-ghost" href="/signin">Sign in</Link>
        </div>
      </nav>
      <header className="wa-hero">
        <p className="eyebrow"><span className="eyebrow-dot" /> WhatsApp entry point</p>
        <h1>The referee,<br /><em>in the chat.</em></h1>
        <p>Send an offer or recruiter message. The bot runs the same four-state check and replies with the evidence and a report link.</p>
        <small>Simulator · production uses the Meta Cloud API webhook at <code>/api/whatsapp/webhook</code>.</small>
      </header>
      <div className="wa-shell">
        <WhatsAppSimulator />
      </div>
      <LegalFooter />
    </main>
  );
}
