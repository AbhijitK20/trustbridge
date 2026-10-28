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

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function progressFor(deal: { status: string; milestones: Array<{ status: string }> }) {
  if (deal.milestones.length > 0) {
    const released = deal.milestones.filter((item) => item.status === "RELEASED").length;
    return Math.round((released / deal.milestones.length) * 100);
  }
  switch (deal.status) {
    case "AWAITING_PAYMENT":
      return 10;
    case "HELD":
      return 35;
    case "DELIVERED":
      return 70;
    case "CONFIRMED":
      return 90;
    case "RELEASED":
    case "REFUNDED":
    case "EXPIRED":
      return 100;
    case "DISPUTED":
      return 50;
    default:
      return 0;
  }
}

function releasedFor(deal: {
  status: string;
  priceCents: number;
  depositCents: number;
  balanceCents: number;
  depositReleasedAt: Date | null;
  balanceReleasedAt: Date | null;
  milestones: Array<{ status: string; amountCents: number }>;
}) {
  if (deal.status === "REFUNDED") return 0;
  if (deal.status === "RELEASED") return deal.priceCents;
  if (deal.milestones.length > 0) {
    return deal.milestones
      .filter((item) => item.status === "RELEASED")
      .reduce((sum, item) => sum + item.amountCents, 0);
  }
  return (
    (deal.depositReleasedAt ? deal.depositCents : 0) +
    (deal.balanceReleasedAt ? deal.balanceCents : 0)
  );
}

function nextAction(view: "buyer" | "seller", status: string) {
  const actions: Record<string, { buyer: string; seller: string }> = {
    AWAITING_PAYMENT: { buyer: "Fund this deal", seller: "Waiting for payment" },
    HELD: { buyer: "Waiting for delivery", seller: "Submit delivery" },
    DELIVERED: { buyer: "Review delivery", seller: "Waiting for review" },
    CONFIRMED: { buyer: "Release processing", seller: "Payout processing" },
    DISPUTED: { buyer: "Dispute under review", seller: "Respond to dispute" },
    RELEASED: { buyer: "Completed", seller: "Paid out" },
    REFUNDED: { buyer: "Refunded", seller: "Refunded" },
    EXPIRED: { buyer: "Expired", seller: "Expired" },
  };
  return actions[status]?.[view] ?? "Review this deal";
}

function loadDeals(userId: string, view: "buyer" | "seller") {
  return prisma.deal.findMany({
    where: view === "buyer" ? { buyerId: userId } : { sellerId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      sellerProfile: {
        include: {
          user: { select: { name: true } },
          kyc: { select: { legalName: true } },
        },
      },
      milestones: { orderBy: { position: "asc" } },
      contract: { select: { status: true, number: true } },
      verificationCheck: { select: { outcome: true } },
    },
  });
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      role: true,
      sellerProfile: { select: { id: true, isVerified: true, trustScore: true } },
    },
  });
  if (!user) redirect("/signin");

  const requested = (await searchParams).view;
  const isSeller = Boolean(user.sellerProfile);
  const defaultView: "buyer" | "seller" = user.role === "SELLER" && isSeller ? "seller" : "buyer";
  const view: "buyer" | "seller" =
    requested === "seller" && isSeller ? "seller" : requested === "buyer" ? "buyer" : defaultView;

  const deals = await loadDeals(user.id, view);
  const funded = deals.filter((deal) => !["DRAFT", "AWAITING_PAYMENT"].includes(deal.status));
  const active = funded.filter((deal) => !["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status));
  const released = funded.reduce((sum, deal) => sum + releasedFor(deal), 0);
  const held = funded.reduce((sum, deal) => {
    if (["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status)) return sum;
    return sum + Math.max(0, deal.priceCents - releasedFor(deal));
  }, 0);
  const protectedTotal = active.reduce((sum, deal) => sum + deal.priceCents, 0);
  const attentionDeals = deals.filter((deal) =>
    view === "buyer"
      ? ["DELIVERED", "DISPUTED"].includes(deal.status)
      : ["HELD", "DISPUTED"].includes(deal.status),
  );
  const disputes = deals.filter((deal) => deal.status === "DISPUTED").length;
  const name = user.name?.split(/\s+/)[0] ?? "there";

  // Six-month protected volume series.
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return { key: monthKey(date), label: date.toLocaleDateString("en-IN", { month: "short" }) };
  });
  const series = months.map((month) => ({
    ...month,
    total: funded
      .filter((deal) => monthKey(deal.createdAt) === month.key)
      .reduce((sum, deal) => sum + deal.priceCents, 0),
  }));
  const peak = Math.max(1, ...series.map((item) => item.total));

  const recent = deals.slice(0, 6);
  const activity = deals.slice(0, 5);

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">
            {view} desk · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </p>
          <h1>
            Good to see you, <em>{name}.</em>
          </h1>
          <p>
            {active.length > 0
              ? `${active.length} ${active.length === 1 ? "deal is" : "deals are"} live and ${money(held, "INR")} is still protected. Here is the single next action on each one.`
              : "Nothing is in flight right now. Start a protected deal or verify a claim before you pay."}
          </p>
        </div>
        <div className="ws-head-actions">
          <div className="ws-seg" role="group" aria-label="Choose desk">
            <Link className={view === "buyer" ? "is-active" : ""} href="/dashboard?view=buyer">
              Buyer
            </Link>
            {isSeller && (
              <Link className={view === "seller" ? "is-active" : ""} href="/dashboard?view=seller">
                Seller
              </Link>
            )}
          </div>
          <Link className="ws-btn" href="/dashboard/new">
            New deal <i>↗</i>
          </Link>
        </div>
      </header>

      <section className="ws-kpis" aria-label="Workspace summary">
        <div className="ws-kpi">
          <span className="ws-kpi-label">Protected in flight</span>
          <span className="ws-kpi-value">{money(protectedTotal, "INR")}</span>
          <span className="ws-kpi-note">Across {active.length} active {active.length === 1 ? "deal" : "deals"}</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">{view === "buyer" ? "Released to sellers" : "Released to you"}</span>
          <span className="ws-kpi-value">{money(released, "INR")}</span>
          <span className="ws-kpi-note">After delivery or milestone approval</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Waiting on you</span>
          <span className="ws-kpi-value">{attentionDeals.length}</span>
          <span className="ws-kpi-note">{view === "buyer" ? "Deliveries to review" : "Deals waiting for delivery"}</span>
        </div>
        <div className="ws-kpi ws-kpi-dark">
          <span className="ws-kpi-label">Open disputes</span>
          <span className="ws-kpi-value">{disputes}</span>
          <span className="ws-kpi-note">{disputes > 0 ? "A human referee is reviewing" : "No disputes on the record"}</span>
        </div>
      </section>

      <div className="ws-grid-2">
        <section className="ws-panel" aria-label="Protected volume">
          <div className="ws-panel-head">
            <div>
              <small>Volume</small>
              <h2>Protected, month by month</h2>
            </div>
            <span className="ws-row-note">Last 6 months</span>
          </div>
          <div className="ws-panel-body">
            <div className="ws-chart">
              {series.map((item, index) => (
                <div className="ws-chart-col" key={item.key}>
                  <span className="ws-chart-value">{item.total > 0 ? money(item.total, "INR") : "—"}</span>
                  <div
                    className={`ws-chart-bar ${index === series.length - 1 ? "is-current" : ""}`}
                    style={{
                      height: `${Math.max(3, Math.round((item.total / peak) * 100))}%`,
                      animationDelay: `${index * 70}ms`,
                    }}
                  />
                  <span className="ws-chart-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ws-panel" aria-label="Needs attention">
          <div className="ws-panel-head">
            <div>
              <small>Queue</small>
              <h2>Needs your action</h2>
            </div>
            <Link href="/dashboard/deals">View all</Link>
          </div>
          <div className="ws-panel-body-flush">
            {attentionDeals.length === 0 ? (
              <p className="ws-empty">You are all clear. Nothing waits on you.</p>
            ) : (
              attentionDeals.slice(0, 4).map((deal) => (
                <Link className="ws-task" href={`/deal/${deal.publicToken}`} key={deal.id}>
                  <span className={`ws-task-mark ${deal.status === "DISPUTED" ? "is-urgent" : ""}`}>
                    {deal.status === "DISPUTED" ? "!" : "→"}
                  </span>
                  <span className="ws-task-copy">
                    <strong>{deal.title}</strong>
                    <small>
                      {nextAction(view, deal.status)} · {money(deal.priceCents, deal.currency)}
                    </small>
                  </span>
                  <span className="ws-task-action">Open</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="ws-panel" style={{ marginTop: 12 }} aria-label="Recent deals">
        <div className="ws-panel-head">
          <div>
            <small>Deals</small>
            <h2>Recently updated</h2>
          </div>
          <Link href="/dashboard/deals">All deals</Link>
        </div>
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Counterparty</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Progress</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <span className="ws-empty" style={{ display: "block" }}>
                      No deals yet.{" "}
                      <Link className="ws-inline-link" href="/dashboard/new">
                        Create the first one
                      </Link>
                      .
                    </span>
                  </td>
                </tr>
              ) : (
                recent.map((deal) => {
                  const progress = progressFor(deal);
                  const counterparty =
                    view === "buyer"
                      ? deal.sellerProfile?.kyc?.legalName ?? deal.seller.name ?? deal.seller.email
                      : deal.buyer?.name ?? deal.buyer?.email ?? "Buyer";
                  return (
                    <tr key={deal.id}>
                      <td>
                        <Link href={`/deal/${deal.publicToken}`} className="ws-cell-title">
                          {deal.title}
                        </Link>
                        <span className="ws-cell-sub">
                          #{deal.publicToken.slice(-6).toUpperCase()}
                          {deal.contract ? ` · contract ${label(deal.contract.status)}` : ""}
                        </span>
                      </td>
                      <td>
                        <span className="ws-cell-title" style={{ fontSize: 11.5, fontWeight: 400 }}>
                          {counterparty}
                        </span>
                      </td>
                      <td className="ws-cell-money">{money(deal.priceCents, deal.currency)}</td>
                      <td>
                        <span className={`ws-status ws-status-${deal.status.toLowerCase()}`}>
                          <i /> {label(deal.status)}
                        </span>
                      </td>
                      <td style={{ minWidth: 110 }}>
                        <div className="ws-meter">
                          <span style={{ width: `${progress}%` }} />
                        </div>
                        <div className="ws-meter-label">
                          <span>{progress}%</span>
                          <span>{nextAction(view, deal.status)}</span>
                        </div>
                      </td>
                      <td className="ws-cell-right">
                        <Link className="ws-row-arrow" href={`/deal/${deal.publicToken}`} aria-label={`Open ${deal.title}`}>
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
        <section className="ws-panel" aria-label="Recent activity">
          <div className="ws-panel-head">
            <div>
              <small>Record</small>
              <h2>Latest activity</h2>
            </div>
          </div>
          <div className="ws-activity">
            {activity.length === 0 ? (
              <p className="ws-empty">Activity appears once a deal moves.</p>
            ) : (
              activity.map((deal) => (
                <div className="ws-activity-item" key={deal.id}>
                  <span className="ws-activity-dot" />
                  <span>
                    <strong>
                      {deal.title} — {label(deal.status)}
                    </strong>
                    <small>
                      {deal.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                      {deal.contract ? `contract ${label(deal.contract.status)}` : "record updated"}
                    </small>
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="ws-panel" aria-label="How protection works">
          <div className="ws-panel-head">
            <div>
              <small>Rules</small>
              <h2>The money rule</h2>
            </div>
            <Link href="/legal/refunds">Read</Link>
          </div>
          <div className="ws-panel-body">
            <p className="ws-split-note">
              The buyer pays the seller price plus the {(Number(process.env.PLATFORM_FEE_PERCENT ?? 3))}%
              protection fee. The seller receives the full price. Fees are never part of the protected
              balance, and no money moves on a claim alone.
            </p>
            <hr className="ws-divider" />
            <div className="ws-fact">
              <span>Demo mode</span>
              <strong>Sandbox ledger</strong>
            </div>
            <div className="ws-fact">
              <span>Human review</span>
              <strong>On every dispute</strong>
            </div>
          </div>
        </section>
      </div>

      <p className="ws-footer-note">
        Buyer pays price + {Number(process.env.PLATFORM_FEE_PERCENT ?? 3)}% fee · seller receives the full price
      </p>
    </>
  );
}
