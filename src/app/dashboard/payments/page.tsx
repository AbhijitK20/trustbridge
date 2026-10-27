import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculatePlatformFee } from "@/lib/stripe";

function money(cents: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type PaymentDeal = Awaited<ReturnType<typeof loadDeals>>[number];

function loadDeals(userId: string) {
  return prisma.deal.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    orderBy: { updatedAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      sellerProfile: { include: { user: { select: { name: true } } } },
      milestones: { orderBy: { position: "asc" } },
    },
  });
}

function releasedFor(deal: PaymentDeal) {
  if (deal.status === "REFUNDED") return 0;
  if (deal.status === "RELEASED") return deal.priceCents;
  if (deal.milestones.length > 0) {
    return deal.milestones
      .filter((milestone) => milestone.status === "RELEASED")
      .reduce((sum, milestone) => sum + milestone.amountCents, 0);
  }
  return (
    (deal.depositReleasedAt ? deal.depositCents : 0) +
    (deal.balanceReleasedAt ? deal.balanceCents : 0)
  );
}

export default async function DashboardPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/payments");

  const deals = await loadDeals(session.user.id);
  const funded = deals.filter((deal) => !["DRAFT", "AWAITING_PAYMENT"].includes(deal.status));
  const totals = funded.reduce(
    (sum, deal) => {
      const fee = deal.platformFeeCents || calculatePlatformFee(deal.priceCents);
      const released = releasedFor(deal);
      const held = ["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status)
        ? 0
        : Math.max(0, deal.priceCents - released);
      return {
        buyerTotal: sum.buyerTotal + deal.priceCents + fee,
        fees: sum.fees + fee,
        released: sum.released + released,
        held: sum.held + held,
      };
    },
    { buyerTotal: 0, fees: 0, released: 0, held: 0 },
  );

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Money · sandbox ledger</p>
          <h1>
            Follow the <em>money.</em>
          </h1>
          <p>
            One line per deal: buyer total, protection fee, held balance, and released amount. No
            real money moves in this environment.
          </p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn ws-btn-ghost" href="/dashboard/deals">
            All deals <i>↗</i>
          </Link>
        </div>
      </header>

      <section className="ws-kpis">
        <div className="ws-kpi ws-kpi-dark">
          <span className="ws-kpi-label">Buyer payments</span>
          <span className="ws-kpi-value">{money(totals.buyerTotal)}</span>
          <span className="ws-kpi-note">Seller price + protection fee</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Still protected</span>
          <span className="ws-kpi-value">{money(totals.held)}</span>
          <span className="ws-kpi-note">Not released to a seller yet</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Released</span>
          <span className="ws-kpi-value">{money(totals.released)}</span>
          <span className="ws-kpi-note">After delivery or milestone approval</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Platform fees</span>
          <span className="ws-kpi-value">{money(totals.fees)}</span>
          <span className="ws-kpi-note">Never part of the protected balance</span>
        </div>
      </section>

      <section className="ws-panel" style={{ marginTop: 12 }}>
        <div className="ws-panel-head">
          <div>
            <small>Ledger</small>
            <h2>Every payment line</h2>
          </div>
          <Link href="/legal/refunds">Refund rules</Link>
        </div>
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Status</th>
                <th>Seller price</th>
                <th>Fee</th>
                <th>Released</th>
                <th>Held</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {funded.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <span className="ws-empty" style={{ display: "block" }}>
                      No funded deals yet.{" "}
                      <Link className="ws-inline-link" href="/create">
                        Fund the first one
                      </Link>
                      .
                    </span>
                  </td>
                </tr>
              ) : (
                funded.map((deal) => {
                  const fee = deal.platformFeeCents || calculatePlatformFee(deal.priceCents);
                  const released = releasedFor(deal);
                  const held = ["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status)
                    ? 0
                    : Math.max(0, deal.priceCents - released);
                  return (
                    <tr key={deal.id}>
                      <td>
                        <Link className="ws-cell-title" href={`/deal/${deal.publicToken}`}>
                          {deal.title}
                        </Link>
                        <span className="ws-cell-sub">
                          #{deal.publicToken.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`ws-status ws-status-${deal.status.toLowerCase()}`}>
                          <i /> {deal.status.replaceAll("_", " ").toLowerCase()}
                        </span>
                      </td>
                      <td className="ws-cell-money">{money(deal.priceCents, deal.currency)}</td>
                      <td className="ws-cell-money">{money(fee, deal.currency)}</td>
                      <td className="ws-cell-money">{money(released, deal.currency)}</td>
                      <td className="ws-cell-money">{money(held, deal.currency)}</td>
                      <td className="ws-cell-right">
                        <Link className="ws-row-arrow" href={`/deal/${deal.publicToken}`} aria-label="Open deal">
                          ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ws-grid-2">
        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Split</small>
              <h2>Who pays what</h2>
            </div>
          </div>
          <div className="ws-panel-body">
            <div className="ws-fact">
              <span>Buyer pays</span>
              <strong>Seller price + {Number(process.env.PLATFORM_FEE_PERCENT ?? 3)}% fee</strong>
            </div>
            <div className="ws-fact">
              <span>Seller receives</span>
              <strong>Full seller price</strong>
            </div>
            <div className="ws-fact">
              <span>Held by</span>
              <strong>Payment partner, not TrustBridge</strong>
            </div>
            <div className="ws-fact">
              <span>Released when</span>
              <strong>Delivery accepted or milestone approved</strong>
            </div>
          </div>
        </section>

        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Status</small>
              <h2>Test mode</h2>
            </div>
          </div>
          <div className="ws-panel-body">
            <p className="ws-split-note">
              Razorpay and Stripe run in test mode in this environment. Ledger entries are recorded,
              but no bank transfer occurs. Sandbox decisions still update the deal record and the
              audit trail.
            </p>
            <hr className="ws-divider" />
            <Link className="ws-btn ws-btn-ghost" href="/dashboard/checks">
              Review evidence <i>↗</i>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
