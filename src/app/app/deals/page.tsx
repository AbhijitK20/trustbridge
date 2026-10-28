import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

export default async function AppDealsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const deals = await prisma.deal.findMany({
    where: { OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      sellerProfile: { include: { user: { select: { name: true } } } },
      milestones: { orderBy: { position: "asc" } },
    },
  });
  const active = deals.filter((deal) => !["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status));
  const closed = deals.filter((deal) => ["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status));

  return (
    <div className="app-page">
      <header className="app-page-head">
        <p className="eyebrow">
          <span className="eyebrow-dot" /> Your record
        </p>
        <h1>
          Everything
          <br />
          <em>in one place.</em>
        </h1>
        <p>Active work, closed deals, and the evidence behind every release.</p>
      </header>

      <section className="app-section app-section-first">
        <div className="app-section-head">
          <div>
            <p className="card-label">IN FLIGHT</p>
            <h2>Active deals.</h2>
          </div>
          <span className="app-count">{active.length}</span>
        </div>
        {active.length === 0 ? (
          <div className="app-empty app-empty-compact">
            <h3>Nothing in flight.</h3>
            <p>Create a deal or check an offer before you pay.</p>
            <Link className="app-button" href="/create">
              New protected deal
            </Link>
          </div>
        ) : (
          <div className="app-deal-list">
            {active.map((deal) => {
              const released = deal.milestones.filter((milestone) => milestone.status === "RELEASED").length;
              return (
                <Link className="app-deal-card" href={`/app/deals/${deal.publicToken}`} key={deal.id}>
                  <div className="app-deal-card-top">
                    <span className={`app-status app-status-${deal.status.toLowerCase()}`}>
                      {statusLabel(deal.status)}
                    </span>
                    <span className="app-deal-amount">{money(deal.priceCents, deal.currency)}</span>
                  </div>
                  <h3>{deal.title}</h3>
                  <div className="app-deal-meta">
                    <span>{deal.sellerProfile.user.name ?? "Seller"}</span>
                    <span>
                      {deal.milestones.length > 0
                        ? `${released}/${deal.milestones.length} milestones`
                        : deal.deliveryDeadline
                          ? `Due ${new Date(deal.deliveryDeadline).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}`
                          : "Protected"}
                    </span>
                  </div>
                  {deal.milestones.length > 0 && (
                    <div className="app-mini-progress">
                      <span style={{ width: `${Math.round((released / deal.milestones.length) * 100)}%` }} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {closed.length > 0 && (
        <section className="app-section">
          <div className="app-section-head">
            <div>
              <p className="card-label">CLOSED</p>
              <h2>The archive.</h2>
            </div>
            <span className="app-count">{closed.length}</span>
          </div>
          <div className="app-deal-list app-deal-list-muted">
            {closed.map((deal) => (
              <Link className="app-deal-card" href={`/app/deals/${deal.publicToken}`} key={deal.id}>
                <div className="app-deal-card-top">
                  <span className={`app-status app-status-${deal.status.toLowerCase()}`}>
                    {statusLabel(deal.status)}
                  </span>
                  <span className="app-deal-amount">{money(deal.priceCents, deal.currency)}</span>
                </div>
                <h3>{deal.title}</h3>
                <div className="app-deal-meta">
                  <span>{deal.sellerProfile.user.name ?? "Seller"}</span>
                  <span>
                    {deal.balanceReleasedAt
                      ? "Completed"
                      : deal.status === "REFUNDED"
                        ? "Refunded"
                        : "Closed"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
