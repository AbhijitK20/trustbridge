import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { CheckResult } from "@/lib/verification";

export default async function VerificationReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const check = await prisma.verificationCheck.findUnique({
    where: { id },
    select: {
      id: true,
      outcome: true,
      decision: true,
      organization: true,
      createdAt: true,
      result: true,
    },
  });

  if (!check) notFound();
  const report = check.result as unknown as CheckResult;
  const outcome = check.outcome.toLowerCase().replaceAll("_", "-");

  return (
    <main className="check-page verification-page">
      <nav className="topbar check-topbar">
        <Link className="brand" href="/" aria-label="TrustBridge home">
          <span className="brand-mark">T</span> trustbridge
        </Link>
        <div className="nav-links">
          <Link href="/check">Verify a claim</Link>
          <Link href="/referee">Referee chat</Link>
          <Link className="nav-ghost" href="/signin">Sign in</Link>
        </div>
      </nav>

      <header className="verification-hero">
        <p className="eyebrow">Verification report · #{check.id.slice(0, 8).toUpperCase()}</p>
        <h1>{report.headline}</h1>
        <p className="verification-summary">{report.summary}</p>
        <div className="verification-hero-meta">
          <span className={`verdict-pill verdict-${outcome}`}>
            {check.outcome.replaceAll("_", " ")}
          </span>
          <span className="verification-decision">
            Recommended · {check.decision.replaceAll("_", " ").toLowerCase()}
          </span>
          <span className="verification-org">
            {check.organization} ·{" "}
            {new Date(check.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
      </header>

      <section className="verification-report">
        <section className={`check-result outcome-${outcome}`}>
          <div className="result-top">
            <span className="result-id">Report #{check.id.slice(-6).toUpperCase()}</span>
            <span className="result-advice">Advisory · a human decides any dispute</span>
          </div>

          <div className="decision-line">
            <span>Recommended action</span>
            <strong>{check.decision.replaceAll("_", " ").toLowerCase()}</strong>
          </div>

          <div className="coverage-row" aria-label="Evidence coverage">
            {Object.entries(report.coverage).map(([tier, count]) => (
              <span key={tier}><b>{count}</b> {tier}</span>
            ))}
          </div>

          <div className="result-columns">
            <div>
              <p className="card-label">WHAT WE COULD NOT DETERMINE</p>
              <ul>
                {report.couldNotDetermine.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="card-label">CONDITIONS</p>
              {report.conditions.length > 0 ? (
                <ul>
                  {report.conditions.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p className="result-none">None for this check.</p>
              )}
            </div>
          </div>

          <div className="claim-stack">
            {report.claims.map((claim) => (
              <article className="claim-card" key={claim.id}>
                <div className="claim-head">
                  <span className={`claim-outcome outcome-${claim.outcome.toLowerCase().replaceAll("_", "-")}`}>
                    {claim.outcome.replaceAll("_", " ")}
                  </span>
                  <span className="claim-material">{claim.material ? "MATERIAL" : "CONTEXT"}</span>
                </div>
                <h3>{claim.text}</h3>
                <p>{claim.rationale}</p>
                <div className="evidence-list">
                  {claim.evidence.map((evidence) => (
                    <div className="evidence-item" key={evidence.id}>
                      <div className="evidence-meta">
                        <span className={`tier-chip tier-${evidence.tier.toLowerCase()}`}>{evidence.tier}</span>
                        <span className="timing-chip">{evidence.timing}</span>
                        <span className={`relation-chip relation-${evidence.relation.toLowerCase()}`}>{evidence.relation}</span>
                      </div>
                      <p>{evidence.label}</p>
                      {evidence.quote && <blockquote>“{evidence.quote}”</blockquote>}
                      {evidence.note && <small>{evidence.note}</small>}
                      {evidence.url && <a href={evidence.url} target="_blank" rel="noreferrer">Open source ↗</a>}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p className="check-disclaimer">{report.disclaimer}</p>
        </section>
      </section>

      <footer className="check-footer">
        <span>Verification is unilateral. Protection is bilateral.</span>
        <span>This report is advisory; a human decides any dispute.</span>
      </footer>
    </main>
  );
}
