import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const RESOLUTION: Record<string, string> = {
  RELEASE_TO_SELLER: "Released to seller",
  REFUND_TO_BUYER: "Refunded to buyer",
  SPLIT_SETTLEMENT: "Split settlement",
};

export default async function DashboardDisputesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/disputes");

  const disputes = await prisma.dispute.findMany({
    where: {
      OR: [
        { reporterId: session.user.id },
        { deal: { buyerId: session.user.id } },
        { deal: { sellerId: session.user.id } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      deal: {
        select: {
          title: true,
          publicToken: true,
          priceCents: true,
          currency: true,
          buyerId: true,
          sellerId: true,
        },
      },
      reporter: { select: { name: true, email: true } },
    },
  });

  const open = disputes.filter((item) => !item.resolvedAt);
  const resolved = disputes.filter((item) => item.resolvedAt);

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Workspace · disputes</p>
          <h1>
            Disagreements, <em>on the record.</em>
          </h1>
          <p>
            A dispute freezes the money and asks a human to decide from the agreement and the
            evidence. Nothing moves on one side&apos;s word.
          </p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn ws-btn-ghost" href="/legal/refunds">
            Refund rules <i>↗</i>
          </Link>
        </div>
      </header>

      <section className="ws-kpis">
        <div className="ws-kpi ws-kpi-dark">
          <span className="ws-kpi-label">Open disputes</span>
          <span className="ws-kpi-value">{open.length}</span>
          <span className="ws-kpi-note">Money stays held until a decision</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Resolved</span>
          <span className="ws-kpi-value">{resolved.length}</span>
          <span className="ws-kpi-note">Closed with a written decision</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Total raised</span>
          <span className="ws-kpi-value">{disputes.length}</span>
          <span className="ws-kpi-note">Across all deals on this workspace</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Reviewer</span>
          <span className="ws-kpi-value" style={{ fontSize: 19 }}>
            Human
          </span>
          <span className="ws-kpi-note">Never an automated release</span>
        </div>
      </section>

      <section className="ws-panel" style={{ marginTop: 12 }}>
        <div className="ws-panel-head">
          <div>
            <small>Cases</small>
            <h2>Dispute record</h2>
          </div>
          <Link href="/dashboard/deals">All deals</Link>
        </div>
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Reason</th>
                <th>Reported by</th>
                <th>Amount</th>
                <th>Opened</th>
                <th>Status</th>
                <th>Resolution</th>
              </tr>
            </thead>
            <tbody>
              {disputes.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <span className="ws-empty" style={{ display: "block" }}>
                      No disputes on the record. Most deals never need one.
                    </span>
                  </td>
                </tr>
              ) : (
                disputes.map((dispute) => (
                  <tr key={dispute.id}>
                    <td>
                      <Link className="ws-cell-title" href={`/deal/${dispute.deal.publicToken}`}>
                        {dispute.deal.title}
                      </Link>
                      <span className="ws-cell-sub">
                        #{dispute.deal.publicToken.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="ws-cell-sub ws-claim" style={{ marginTop: 0 }}>
                        {dispute.reason}
                      </span>
                    </td>
                    <td>
                      <span className="ws-cell-sub" style={{ marginTop: 0 }}>
                        {dispute.reporterId === session.user.id
                          ? "You"
                          : dispute.reporter.name ?? dispute.reporter.email}
                      </span>
                    </td>
                    <td className="ws-cell-money">
                      {money(dispute.deal.priceCents, dispute.deal.currency)}
                    </td>
                    <td className="ws-cell-money">
                      {dispute.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td>
                      <span
                        className={`ws-status ws-status-${dispute.resolvedAt ? "released" : "disputed"}`}
                      >
                        <i /> {dispute.resolvedAt ? "resolved" : "open"}
                      </span>
                    </td>
                    <td>
                      <span className="ws-cell-sub" style={{ marginTop: 0 }}>
                        {dispute.resolution ? RESOLUTION[dispute.resolution] ?? dispute.resolution : "Awaiting decision"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ws-grid-2">
        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Process</small>
              <h2>What happens next</h2>
            </div>
          </div>
          <div className="ws-panel-body">
            <div className="ws-fact">
              <span>1 · Freeze</span>
              <strong>Held money stops moving</strong>
            </div>
            <div className="ws-fact">
              <span>2 · Evidence</span>
              <strong>Both sides add statements and files</strong>
            </div>
            <div className="ws-fact">
              <span>3 · Decision</span>
              <strong>A reviewer records the reason</strong>
            </div>
            <div className="ws-fact">
              <span>4 · Settle</span>
              <strong>Release, refund, or split — once</strong>
            </div>
          </div>
        </section>

        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Rules</small>
              <h2>What a dispute is not</h2>
            </div>
            <Link href="/legal/refunds">Read</Link>
          </div>
          <div className="ws-panel-body">
            <p className="ws-split-note">
              It is not a chargeback, and it is not a guarantee of a refund. The reviewer reads the
              signed scope, the delivery evidence, and the verification outcome, then decides which
              of the four outcomes the record supports.
            </p>
            <hr className="ws-divider" />
            <p className="ws-footer-note">Human review · written decision · audit entry</p>
          </div>
        </section>
      </div>
    </>
  );
}
