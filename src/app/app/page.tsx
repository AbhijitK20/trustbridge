import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function money(cents: number, currency = "inr") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

function initials(name: string | null | undefined) {
  if (!name) return "TB";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function AppHomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true },
  });
  const deals = await prisma.deal.findMany({
    where: { OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }] },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      sellerProfile: { include: { user: { select: { name: true } } } },
      milestones: { orderBy: { position: "asc" } },
    },
  });
  const active = deals.filter((deal) => !["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status));
  const protectedCents = active.reduce((total, deal) => total + deal.priceCents, 0);
  const openDisputes = deals.filter((deal) => deal.status === "DISPUTED").length;
  const firstName = user?.name?.split(/\s+/)[0] ?? "there";

  return (
    <div className="app-home">
      <section className="app-greeting">
        <p className="eyebrow">
          <span className="eyebrow-dot" /> Your protected workspace
        </p>
        <div className="app-greeting-row">
          <h1>
            Hello, <em>{firstName}.</em>
          </h1>
          <span className="app-mini-avatar">{initials(user?.name)}</span>
        </div>
        <p>Verify the claim, then protect the work. Every decision stays on the record.</p>
      </section>

      <section className="app-hero">
        <span className="app-hero-kicker">THE TRUST LAYER</span>
        <h2>
          A screenshot
          <br />
          <em>is not proof.</em>
        </h2>
        <p>
          Check the offer against independent evidence before you send money. If the record is
          incomplete, protect the deal instead.
        </p>
        <div className="app-hero-actions">
          <Link className="app-button app-button-lime" href="/app/check">
            Check an offer <span>↗</span>
          </Link>
          <Link className="app-text-link" href="/create">
            Protect a deal
          </Link>
        </div>
        <div className="app-hero-mark" aria-hidden="true">
          <span>T</span>
          <small>evidence first</small>
        </div>
      </section>

      <section className="app-stat-grid" aria-label="Workspace summary">
        <div>
          <strong>{active.length}</strong>
          <span>active deals</span>
        </div>
        <div>
          <strong>{money(protectedCents)}</strong>
          <span>protected</span>
        </div>
        <div>
          <strong>{openDisputes}</strong>
          <span>open disputes</span>
        </div>
      </section>

      <section className="app-section">
        <div className="app-section-head">
          <div>
            <p className="card-label">QUICK ACTIONS</p>
            <h2>Keep moving.</h2>
          </div>
        </div>
        <div className="app-quick-grid">
          <Link className="app-quick-card" href="/app/check">
            <span className="app-quick-icon">01</span>
            <strong>Verify a claim</strong>
            <small>Four outcomes. Evidence tiers. No fake certainty.</small>
            <span className="app-quick-arrow">↗</span>
          </Link>
          <Link className="app-quick-card" href="/create">
            <span className="app-quick-icon">02</span>
            <strong>New deal</strong>
            <small>Write the scope, set milestones, share one link.</small>
            <span className="app-quick-arrow">↗</span>
          </Link>
          <Link className="app-quick-card" href="/dashboard">
            <span className="app-quick-icon">03</span>
            <strong>Dashboard</strong>
            <small>Progress, next action, and money in one place.</small>
            <span className="app-quick-arrow">↗</span>
          </Link>
          <Link className="app-quick-card app-quick-card-dark" href="/demo/whatsapp">
            <span className="app-quick-icon">04</span>
            <strong>WhatsApp bot</strong>
            <small>Send a suspicious offer to the referee.</small>
            <span className="app-quick-arrow">↗</span>
          </Link>
        </div>
      </section>

      <section className="app-section">
        <div className="app-section-head">
          <div>
            <p className="card-label">IN FLIGHT</p>
            <h2>Your deals.</h2>
          </div>
          <Link className="app-section-link" href="/app/deals">
            See all
          </Link>
        </div>
        {active.length === 0 ? (
          <div className="app-empty">
            <h3>No active deals yet.</h3>
            <p>Start with a check, then turn the verdict into a protected agreement.</p>
            <Link className="app-button" href="/create">
              Create a protected deal
            </Link>
          </div>
        ) : (
          <div className="app-deal-list">
            {active.slice(0, 4).map((deal) => {
              const released = deal.milestones.filter((milestone) => milestone.status === "RELEASED").length;
              const total = deal.milestones.length;
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
                      {total > 0
                        ? `${released}/${total} milestones`
                        : deal.autoReleaseAt
                          ? "In review"
                          : "Protected"}
                    </span>
                  </div>
                  {total > 0 && (
                    <div className="app-mini-progress">
                      <span style={{ width: `${total > 0 ? Math.round((released / total) * 100) : 0}%` }} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="app-trust-note">
        <p className="card-label">THE RULE</p>
        <blockquote>“Verification is unilateral. Protection is bilateral.”</blockquote>
        <p>
          TrustBridge never claims to be a bank or licensed escrow. Funds are held by the named
          payment partner; human review decides disputes.
        </p>
      </section>
    </div>
  );
}
