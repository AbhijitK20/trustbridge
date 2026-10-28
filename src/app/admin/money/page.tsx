import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { calculatePlatformFee } from "@/lib/stripe";
import AdminNav from "../admin-nav";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type MoneyDeal = Awaited<ReturnType<typeof loadDeals>>[number];

function loadDeals() {
  return prisma.deal.findMany({
    where: { status: { notIn: ["DRAFT", "AWAITING_PAYMENT"] } },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      milestones: { orderBy: { position: "asc" } },
    },
  });
}

function releasedCents(deal: MoneyDeal) {
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

function heldCents(deal: MoneyDeal, released: number) {
  if (deal.status === "REFUNDED" || deal.status === "RELEASED") return 0;
  return Math.max(0, deal.priceCents - released);
}

export default async function AdminMoneyPage() {
  if (!(await requireAdmin())) redirect("/signin");

  const deals = await loadDeals();
  const rows = deals.map((deal) => {
    const fee = deal.platformFeeCents || calculatePlatformFee(deal.priceCents);
    const released = releasedCents(deal);
    return {
      deal,
      fee,
      released,
      held: heldCents(deal, released),
      refunded: deal.status === "REFUNDED" ? deal.priceCents : 0,
      buyerTotal: deal.priceCents + fee,
    };
  });

  const totals = rows.reduce(
    (sum, row) => ({
      buyerTotal: sum.buyerTotal + row.buyerTotal,
      sellerPrice: sum.sellerPrice + row.deal.priceCents,
      fees: sum.fees + row.fee,
      released: sum.released + row.released,
      held: sum.held + row.held,
      refunded: sum.refunded + row.refunded,
    }),
    { buyerTotal: 0, sellerPrice: 0, fees: 0, released: 0, held: 0, refunded: 0 },
  );

  return (
    <main className="admin-page">
      <AdminNav section="money" />

      <header className="admin-header">
        <p className="eyebrow">Money desk · test data</p>
        <h1>Every rupee,<br /><em>one line.</em></h1>
        <p>
          Buyer pays the seller price plus the 3% protection fee. The seller receives the full price.
          The platform fee stays outside the protected balance.
        </p>
      </header>

      <section className="dispute-list">
        <article className="dispute-card">
          <div className="dispute-meta">
            <span className="status-pill"><b /> {rows.length} funded deals</span>
            <span className="small-muted">TEST MODE · NO REAL MONEY</span>
          </div>
          <div className="dispute-grid">
            <div>
              <strong>{money(totals.buyerTotal, "INR")}</strong>
              <small>Buyer payments · {money(totals.sellerPrice, "INR")} seller price + {money(totals.fees, "INR")} protection fees</small>
            </div>
            <div>
              <strong>{money(totals.held, "INR")}</strong>
              <small>Still protected · {money(totals.released, "INR")} released · {money(totals.refunded, "INR")} refunded</small>
            </div>
          </div>
        </article>

        {rows.length === 0 ? (
          <section className="empty-state">
            <h2>No funded deals yet.</h2>
            <p>Once a buyer funds a deal, the four money numbers will appear here.</p>
          </section>
        ) : (
          rows.map(({ deal, fee, released, held, refunded, buyerTotal }) => (
            <article className="dispute-card" key={deal.id}>
              <div className="dispute-meta">
                <span className="status-pill"><b /> {deal.status.replaceAll("_", " ")}</span>
                <strong>{money(buyerTotal, deal.currency)} buyer paid</strong>
              </div>
              <h2>{deal.title}</h2>
              <p className="small-muted">
                {deal.buyer?.name ?? deal.buyer?.email ?? "Buyer"} → {deal.seller?.name ?? deal.seller?.email ?? "Seller"}
                {" · "}
                <Link href={`/deal/${deal.publicToken}`}>Open deal ↗</Link>
              </p>
              <div className="dispute-grid">
                <div>
                  <strong>{money(deal.priceCents, deal.currency)}</strong>
                  <small>Seller price · protection fee {money(fee, deal.currency)} · buyer total {money(buyerTotal, deal.currency)}</small>
                </div>
                <div>
                  <strong>{money(held, deal.currency)}</strong>
                  <small>Held now · {money(released, deal.currency)} released · {money(refunded, deal.currency)} refunded · seller receives {money(deal.priceCents, deal.currency)}</small>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
