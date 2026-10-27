import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LegalFooter from "@/components/legal-footer";
import { legalEntity, legalEntityIsTemplate } from "@/lib/legal";
import { LEGAL_PAGES, LEGAL_SLUGS } from "@/lib/legal-content";

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = LEGAL_PAGES[(await params).slug];
  if (!page) return { title: "Legal | TrustBridge" };
  return { title: `${page.title} | TrustBridge`, description: page.description };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = LEGAL_PAGES[slug];
  if (!page) notFound();

  return (
    <main className="legal-page">
      <nav className="topbar check-topbar">
        <Link className="brand" href="/" aria-label="TrustBridge home"><span className="brand-mark">T</span> trustbridge</Link>
        <div className="nav-links">
          <Link href="/check">Check a claim</Link>
          <Link href="/referee">Referee chat</Link>
          <Link className="nav-ghost" href="/legal/grievance">Grievance</Link>
        </div>
      </nav>

      <header className="legal-hero">
        <p className="eyebrow"><span className="eyebrow-dot" /> Legal · {legalEntity.jurisdiction}</p>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        <small>Version {page.version} · Effective {legalEntity.effectiveDate}</small>
      </header>

      <div className="legal-shell">
        {legalEntityIsTemplate && (
          <div className="legal-banner">
            <strong>Template for product and legal review.</strong>
            <p>Entity details, escrow/payment-partner language, and jurisdiction-specific clauses are placeholders. Have local counsel review this document before launch.</p>
          </div>
        )}

        <article className="legal-doc">
          {page.sections.map((section) => (
            <section className="legal-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
            </section>
          ))}
          <p className="legal-contact">
            Questions: <a href={`mailto:${legalEntity.contactEmail}`}>{legalEntity.contactEmail}</a>
            {" · "}
            Grievance: <a href={`mailto:${legalEntity.grievanceEmail}`}>{legalEntity.grievanceEmail}</a>
          </p>
        </article>
      </div>

      <LegalFooter />
    </main>
  );
}
