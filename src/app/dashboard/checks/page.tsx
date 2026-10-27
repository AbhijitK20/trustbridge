import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function tone(outcome: string) {
  if (outcome.startsWith("verified")) return "released";
  if (outcome === "contradicted") return "disputed";
  return "awaiting_payment";
}

export default async function DashboardChecksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/checks");

  const deals = await prisma.deal.findMany({
    where: {
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
      verificationCheckId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      verificationCheck: {
        select: {
          id: true,
          outcome: true,
          decision: true,
          organization: true,
          promise: true,
          createdAt: true,
        },
      },
    },
  });

  const checks = deals
    .map((deal) => ({ deal, check: deal.verificationCheck }))
    .filter((item) => item.check);
  const counts = checks.reduce(
    (acc, item) => {
      const outcome = item.check!.outcome;
      if (outcome.startsWith("verified")) acc.verified += 1;
      else if (outcome === "contradicted") acc.contradicted += 1;
      else acc.undetermined += 1;
      return acc;
    },
    { verified: 0, undetermined: 0, contradicted: 0 },
  );

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Checks · evidence before money</p>
          <h1>
            What was <em>actually proven.</em>
          </h1>
          <p>
            Each check separates a claim from the evidence behind it. Open a report to see the
            sources and the tier that supported the decision.
          </p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn" href="/check">
            Run a check <i>↗</i>
          </Link>
        </div>
      </header>

      <section className="ws-kpis">
        <div className="ws-kpi">
          <span className="ws-kpi-label">Checks run</span>
          <span className="ws-kpi-value">{checks.length}</span>
          <span className="ws-kpi-note">On deals in your workspace</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Supported</span>
          <span className="ws-kpi-value">{counts.verified}</span>
          <span className="ws-kpi-note">Independent evidence agreed</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Undetermined</span>
          <span className="ws-kpi-value">{counts.undetermined}</span>
          <span className="ws-kpi-note">Said so instead of guessing</span>
        </div>
        <div className="ws-kpi ws-kpi-dark">
          <span className="ws-kpi-label">Contradicted</span>
          <span className="ws-kpi-value">{counts.contradicted}</span>
          <span className="ws-kpi-note">Deal should not proceed</span>
        </div>
      </section>

      <section className="ws-panel" style={{ marginTop: 12 }}>
        <div className="ws-panel-head">
          <div>
            <small>History</small>
            <h2>Checks attached to deals</h2>
          </div>
          <Link href="/check">New check</Link>
        </div>
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Organization</th>
                <th>Outcome</th>
                <th>Decision</th>
                <th>Date</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {checks.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <span className="ws-empty" style={{ display: "block" }}>
                      No checks yet.{" "}
                      <Link className="ws-inline-link" href="/check">
                        Verify a claim
                      </Link>{" "}
                      before you send money.
                    </span>
                  </td>
                </tr>
              ) : (
                checks.map(({ deal, check }) => (
                  <tr key={check!.id}>
                    <td>
                      <span className="ws-cell-title ws-claim">{check!.promise}</span>
                      <span className="ws-cell-sub">{deal.title}</span>
                    </td>
                    <td>
                      <span className="ws-cell-title" style={{ fontSize: 11.5, fontWeight: 400 }}>
                        {check!.organization}
                      </span>
                    </td>
                    <td>
                      <span className={`ws-status ws-status-${tone(check!.outcome)}`}>
                        <i /> {label(check!.outcome)}
                      </span>
                    </td>
                    <td>
                      <span className="ws-cell-sub" style={{ marginTop: 0 }}>
                        {label(check!.decision)}
                      </span>
                    </td>
                    <td className="ws-cell-money">
                      {check!.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="ws-cell-right">
                      <Link className="ws-row-arrow" href={`/deal/${deal.publicToken}`} aria-label="Open deal">
                        ↗
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ws-panel" style={{ marginTop: 12 }}>
        <div className="ws-panel-head">
          <div>
            <small>Method</small>
            <h2>Four outcomes, no fake certainty</h2>
          </div>
          <Link href="/check">How it works</Link>
        </div>
        <div className="ws-panel-body">
          <div className="ws-grid-3" style={{ marginTop: 0 }}>
            <div className="ws-fact" style={{ display: "block" }}>
              <span>Verified</span>
              <strong style={{ display: "block", marginTop: 6, textAlign: "left" }}>
                Independent sources support the claim.
              </strong>
            </div>
            <div className="ws-fact" style={{ display: "block" }}>
              <span>Verified with conditions</span>
              <strong style={{ display: "block", marginTop: 6, textAlign: "left" }}>
                Support exists, but a condition remains.
              </strong>
            </div>
            <div className="ws-fact" style={{ display: "block" }}>
              <span>Undetermined / contradicted</span>
              <strong style={{ display: "block", marginTop: 6, textAlign: "left" }}>
                Not enough evidence, or a record conflicts.
              </strong>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
