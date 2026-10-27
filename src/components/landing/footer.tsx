import Link from "next/link";
import { LEGAL_LINKS, legalEntity } from "@/lib/legal";

const product = [
  { href: "/check", label: "Verify a claim" },
  { href: "/create", label: "Create a deal" },
  { href: "/referee", label: "Referee chat" },
  { href: "/demo/scam?preview=1", label: "Extension demo" },
];

const company = [
  { href: "/signin", label: "Sign in" },
  { href: "/seller/verify", label: "Seller verification" },
  { href: "/legal/grievance", label: "Grievance officer" },
];

export function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <Link className="lp-brand" href="/">
              <span className="lp-brand-mark">
                <span>T</span>
              </span>
              trustbridge
            </Link>
            <p>
              Verify first. Protect the deal.
              <br />
              {legalEntity.name}
            </p>
          </div>

          <div className="lp-footer-col">
            <h4>Product</h4>
            {product.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="lp-footer-col">
            <h4>Company</h4>
            {company.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="lp-footer-col">
            <h4>Legal</h4>
            {LEGAL_LINKS.slice(0, 5).map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="lp-footer-big" aria-hidden>
          trustbridge
        </div>

        <div className="lp-footer-bottom">
          <span>© 2026 TrustBridge</span>
          <span>
            TrustBridge is a technology platform, not a bank or licensed escrow.
          </span>
          <span>
            {legalEntity.contactEmail}
          </span>
        </div>
      </div>
    </footer>
  );
}
