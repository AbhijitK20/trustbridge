import Link from "next/link";
import { LEGAL_LINKS, legalEntity } from "@/lib/legal";

export default function LegalFooter() {
  return (
    <footer className="legal-footer">
      <div className="legal-footer-inner">
        <div className="legal-footer-brand">
          <Link className="brand" href="/"><span className="brand-mark">T</span> trustbridge</Link>
          <p>{legalEntity.name}<br />{legalEntity.address}</p>
        </div>
        <nav className="legal-footer-links" aria-label="Legal">
          {LEGAL_LINKS.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="legal-footer-meta">
          <p>TrustBridge is a technology platform, not a bank or licensed escrow. Payments are processed and held by {legalEntity.paymentPartner}.</p>
          <p><a href={`mailto:${legalEntity.contactEmail}`}>{legalEntity.contactEmail}</a> · <a href={`mailto:${legalEntity.grievanceEmail}`}>{legalEntity.grievanceEmail}</a></p>
        </div>
      </div>
    </footer>
  );
}
