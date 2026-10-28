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

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "action", label: "Waiting on you" },
  { key: "done", label: "Completed" },
  { key: "disputed", label: "Disputed" },
] as const;

function matches(deal: { status: string }, tab: string) {
  switch (tab) {
    case "active":
      return !["RELEASED", "REFUNDED", "EXPIRED", "DRAFT"].includes(deal.status);
    case "action":
      return ["DELIVERED", "HELD", "DISPUTED"].includes(deal.status);
    case "done":
      return ["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status);
    case "disputed":
      return deal.status === "DISPUTED";
    default:
      return true;
  }
}

function nextAction(status: string) {
  const map: Record<string, string> = {
    AWAITING_PAYMENT: "Fund",
    HELD: "Waiting for delivery",
    DELIVERED: "Review delivery",
    CONFIRMED: "Release processing",
    DISPUTED: "Under review",
    RELEASED: "Completed",
    REFUNDED: "Refunded",
    EXPIRED: "Expired",
  };
  return map[status] ?? "Review";
}

export default async function DashboardDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/deals");
  const params = await searchParams;
  const tab = TABS.some((item) => item.key === params.tab) ? params.tab! : "all";
  const q = (params.q ?? "").trim().toLowerCase();

  const deals = await prisma.deal.findMany({
    where: { OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      sellerProfile: { include: { kyc: { select: { legalName: true } } } },
      milestones: { select: { status: true } },
    },
  });

  const filtered = deals.filter((deal) => {
    if (!matches(deal, tab)) return false;
    if (!q) return true;
    const buyer = deal.buyer?.name ?? deal.buyer?.email ?? "";
    const seller = deal.sellerProfile?.kyc?.legalName ?? deal.seller?.name ?? deal.seller?.email ?? "";
    return (
      deal.title.toLowerCase().includes(q) ||
      deal.publicToken.toLowerCase().includes(q) ||
      buyer.toLowerCase().includes(q) ||
      seller.toLowerCase().includes(q)
    );
  });

  const isMine = (deal: (typeof deals)[number]) => deal.buyerId === session.user!.id;

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Deals · {deals.length} on the record</p>
          <h1>
            Every deal, <em>one ledger.</em>
          </h1>
          <p>Filter by state, search by title or reference, and open the one that needs you.</p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn" href="/dashboard/new">
            New deal <i>↗</i>
          </Link>
        </div>
      </header>

      <div className="ws-toolbar">
        <div className="ws-tabs" role="tablist" aria-label="Filter deals">
          {TABS.map((item) => {
            const href = q
              ? `/dashboard/deals?tab=${item.key}&q=${encodeURIComponent(q)}`
              : `/dashboard/deals?tab=${item.key}`;
            return (
              <Link
                key={item.key}
                href={href}
                className={tab === item.key ? "is-active" : ""}
                role="tab"
                aria-selected={tab === item.key}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <form className="ws-search" action="/dashboard/deals" role="search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            name="q"
            defaultValue={params.q ?? ""}
            type="search"
            placeholder="Search title, person, or #reference"
            aria-label="Search deals"
          />
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
        </form>
      </div>

      <section className="ws-panel">
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Side</th>
                <th>Counterparty</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Next</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <span className="ws-empty" style={{ display: "block" }}>
                      {q ? `Nothing matches “${params.q}”.` : "No deals in this view yet."}
                    </span>
                  </td>
                </tr>
              ) : (
                filtered.map((deal) => {
                  const mine = isMine(deal);
                  const counterparty = mine
                    ? deal.sellerProfile?.kyc?.legalName ?? deal.seller?.name ?? deal.seller?.email ?? "Seller"
                    : deal.buyer?.name ?? deal.buyer?.email ?? "Buyer";
                  return (
                    <tr key={deal.id}>
                      <td>
                        <Link href={`/deal/${deal.publicToken}`} className="ws-cell-title">
                          {deal.title}
                        </Link>
                        <span className="ws-cell-sub">
                          #{deal.publicToken.slice(-6).toUpperCase()} · updated{" "}
                          {deal.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </td>
                      <td>
                        <span className="ws-chip">{mine ? "Buying" : "Selling"}</span>
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
                      <td>
                        <span className="ws-cell-sub" style={{ marginTop: 0 }}>
                          {nextAction(deal.status)}
                        </span>
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

      <p className="ws-footer-note">
        {filtered.length} of {deals.length} deals shown
      </p>
    </>
  );
}
