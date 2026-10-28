import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withinLastDay } from "@/lib/time";

const TABS = [
  { key: "all", label: "All" },
  { key: "record", label: "Record" },
  { key: "money", label: "Money" },
  { key: "account", label: "Account" },
] as const;

function kindOf(action: string) {
  const value = action.toUpperCase();
  if (/(PAYOUT|PAYMENT|RELEASE|REFUND|CREDIT|FEE|CHECKOUT)/.test(value)) return "money";
  if (/(CONTRACT|DELIVERY|MILESTONE|DISPUTE|EVIDENCE|VERIF|APPROVAL|DECISION)/.test(value)) return "record";
  return "account";
}

function label(action: string) {
  const text = action.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function when(date: Date) {
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/activity");
  const params = await searchParams;
  const kind = TABS.some((tab) => tab.key === params.kind) ? params.kind! : "all";

  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { actorId: session.user.id },
        { deal: { buyerId: session.user.id } },
        { deal: { sellerId: session.user.id } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      deal: { select: { title: true, publicToken: true } },
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  const filtered = kind === "all" ? logs : logs.filter((entry) => kindOf(entry.action) === kind);
  const lastDay = logs.filter((entry) => withinLastDay(entry.createdAt)).length;
  const touchpoints = new Set(logs.map((entry) => entry.dealId).filter(Boolean)).size;

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Account · activity</p>
          <h1>
            Every move, <em>logged.</em>
          </h1>
          <p>
            The audit trail behind your deals: who did what, when, and on which record. Entries are
            append-only.
          </p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn ws-btn-ghost" href="/dashboard/security">
            Security <i>↗</i>
          </Link>
        </div>
      </header>

      <section className="ws-kpis">
        <div className="ws-kpi ws-kpi-dark">
          <span className="ws-kpi-label">Events on record</span>
          <span className="ws-kpi-value">{logs.length}</span>
          <span className="ws-kpi-note">Across your deals and account</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Last 24 hours</span>
          <span className="ws-kpi-value">{lastDay}</span>
          <span className="ws-kpi-note">Recent movements</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Deals touched</span>
          <span className="ws-kpi-value">{touchpoints}</span>
          <span className="ws-kpi-note">Each with its own thread</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Retention</span>
          <span className="ws-kpi-value" style={{ fontSize: 19 }}>
            Append-only
          </span>
          <span className="ws-kpi-note">Nothing is silently edited</span>
        </div>
      </section>

      <div className="ws-toolbar" style={{ marginTop: 12 }}>
        <div className="ws-tabs" role="tablist" aria-label="Filter activity">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "all" ? "/dashboard/activity" : `/dashboard/activity?kind=${tab.key}`}
              className={kind === tab.key ? "is-active" : ""}
              role="tab"
              aria-selected={kind === tab.key}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <span className="ws-row-note">{filtered.length} entries</span>
      </div>

      <section className="ws-panel">
        <div className="ws-panel-head">
          <div>
            <small>Audit trail</small>
            <h2>What happened</h2>
          </div>
          <span className="ws-row-note">Newest first</span>
        </div>
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Event</th>
                <th>Deal</th>
                <th>Actor</th>
                <th>Kind</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <span className="ws-empty" style={{ display: "block" }}>
                      No activity in this view yet.
                    </span>
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td className="ws-cell-money" style={{ whiteSpace: "nowrap" }}>
                      {when(entry.createdAt)}
                    </td>
                    <td>
                      <span className="ws-cell-title" style={{ fontSize: 12.5 }}>
                        {label(entry.action)}
                      </span>
                    </td>
                    <td>
                      {entry.deal ? (
                        <Link
                          className="ws-inline-link"
                          href={`/deal/${entry.deal.publicToken}`}
                          style={{ fontSize: 11.5 }}
                        >
                          {entry.deal.title}
                        </Link>
                      ) : (
                        <span className="ws-cell-sub" style={{ marginTop: 0 }}>
                          Account
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="ws-cell-sub" style={{ marginTop: 0 }}>
                        {entry.actorId === session.user.id
                          ? "You"
                          : entry.actor?.name ?? entry.actor?.email ?? "System"}
                      </span>
                    </td>
                    <td>
                      <span className="ws-chip">{kindOf(entry.action)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="ws-footer-note">
        Audit entries are written by the server on every state change · newest {filtered.length} shown
      </p>
    </>
  );
}
