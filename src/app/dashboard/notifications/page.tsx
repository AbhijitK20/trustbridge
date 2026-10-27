import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export default async function DashboardNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/notifications");

  const [user, deals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, settings: true },
    }),
    prisma.deal.findMany({
      where: { OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }] },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        publicToken: true,
        status: true,
        updatedAt: true,
        buyerId: true,
      },
    }),
  ]);
  if (!user) redirect("/signin");
  const settings = user.settings;

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Account · notifications</p>
          <h1>
            Only the <em>important signal.</em>
          </h1>
          <p>
            Deal updates and dispute decisions go to your login email. Change delivery preferences
            in Settings.
          </p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn" href="/dashboard/settings#notifications">
            Edit preferences <i>↗</i>
          </Link>
        </div>
      </header>

      <div className="ws-grid-2">
        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Delivery</small>
              <h2>{user.email}</h2>
            </div>
            <span className="ws-status ws-status-released">
              <i /> Active
            </span>
          </div>
          <div className="ws-panel-body ws-panel-fill">
            <div className="ws-fact">
              <span>Deal activity</span>
              <strong>{settings?.emailDeals ?? true ? "On" : "Off"}</strong>
            </div>
            <div className="ws-fact">
              <span>Disputes and decisions</span>
              <strong>{settings?.emailDisputes ?? true ? "On" : "Off"}</strong>
            </div>
            <div className="ws-fact">
              <span>Product updates</span>
              <strong>{settings?.emailProduct ?? false ? "On" : "Off"}</strong>
            </div>
            <hr className="ws-divider" />
            <p className="ws-note">
              Email delivery is being verified with Resend. Until verification is complete, deal
              emails may not reach non-owner addresses. No notification is sent for test-mode money.
            </p>
            <div style={{ marginTop: "auto", paddingTop: 16 }}>
              <Link className="ws-btn ws-btn-ghost" href="/dashboard/settings#notifications">
                Manage preferences <i>↗</i>
              </Link>
            </div>
          </div>
        </section>

        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Recent</small>
              <h2>What moved</h2>
            </div>
            <Link href="/dashboard/deals">All deals</Link>
          </div>
          <div className="ws-panel-body-flush">
            {deals.length === 0 ? (
              <p className="ws-empty">Nothing has moved yet.</p>
            ) : (
              deals.slice(0, 5).map((deal) => (
                <Link className="ws-task" href={`/deal/${deal.publicToken}`} key={deal.id}>
                  <span className="ws-task-mark">
                    {deal.status === "DISPUTED" ? "!" : "•"}
                  </span>
                  <span className="ws-task-copy">
                    <strong>{deal.title}</strong>
                    <small>
                      {label(deal.status)} ·{" "}
                      {deal.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </small>
                  </span>
                  <span className="ws-task-action">
                    {deal.buyerId === session.user!.id ? "Buying" : "Selling"}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="ws-panel" style={{ marginTop: 12 }}>
        <div className="ws-panel-head">
          <div>
            <small>Frequency</small>
            <h2>How we send</h2>
          </div>
        </div>
        <div className="ws-panel-body">
          <div className="ws-grid-3" style={{ marginTop: 0 }}>
            <div>
              <span className="ws-kpi-label">Immediate</span>
              <p className="ws-split-note" style={{ marginTop: 6 }}>
                Funding, delivery, release, and dispute events send right away.
              </p>
            </div>
            <div>
              <span className="ws-kpi-label">Deadlines</span>
              <p className="ws-split-note" style={{ marginTop: 6 }}>
                One reminder before a delivery deadline or review window closes.
              </p>
            </div>
            <div>
              <span className="ws-kpi-label">Never</span>
              <p className="ws-split-note" style={{ marginTop: 6 }}>
                No marketing blasts, no re-engagement sequences, no purchased lists.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
