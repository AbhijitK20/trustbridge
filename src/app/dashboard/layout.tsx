import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardSession, getDashboardUser } from "@/lib/dashboard-user";
import { prisma } from "@/lib/prisma";
import DashNav from "./dash-nav";
import LiveRefresher from "./live-refresher";
import WorkspaceCrumb from "./ws-crumb";
import { dashboardSignOut } from "./actions";
import "./dashboard.css";

export const dynamic = "force-dynamic";

function initials(name: string | null | undefined) {
  if (!name) return "TB";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getDashboardSession();
  if (!session?.user?.id) redirect("/signin?next=/dashboard");

  const user = await getDashboardUser();
  if (!user) redirect("/signin");

  const dealRows = await prisma.deal.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    select: { buyerId: true, sellerId: true, status: true },
  });
  const closed = new Set(["RELEASED", "REFUNDED", "EXPIRED"]);
  const buyerActive = dealRows.filter((deal) => deal.buyerId === user.id && !closed.has(deal.status)).length;
  const sellerActive = dealRows.filter((deal) => deal.sellerId === user.id && !closed.has(deal.status)).length;
  const attention = dealRows.filter(
    (deal) =>
      (deal.buyerId === user.id && ["DELIVERED", "DISPUTED"].includes(deal.status)) ||
      (deal.sellerId === user.id && ["HELD", "DISPUTED"].includes(deal.status)),
  ).length;
  const disputes = dealRows.filter(
    (deal) =>
      deal.status === "DISPUTED" &&
      (deal.buyerId === user.id || deal.sellerId === user.id),
  ).length;

  const dealCount = buyerActive + sellerActive;
  const roleLabel = user.role.replaceAll("_", " ").toLowerCase();
  const firstName = user.name?.split(/\s+/)[0] ?? "Member";

  return (
    <div className="workspace">
      <aside className="ws-sidebar">
        <Link className="ws-brand" href="/dashboard">
          <span className="ws-brand-mark">T</span>
          <span>
            trustbridge
            <small>protected workspace</small>
          </span>
        </Link>

        <Link className="ws-switcher" href="/dashboard/profile">
          <span className="ws-switcher-avatar">{initials(user.name)}</span>
          <span className="ws-switcher-copy">
            <strong>{firstName}&rsquo;s workspace</strong>
            <small>
              {roleLabel}
              {user.sellerProfile?.isVerified ? " · verified" : ""}
            </small>
          </span>
          <span aria-hidden="true">⌄</span>
        </Link>

        <DashNav dealCount={dealCount} attentionCount={attention} sellerSlug={user.sellerProfile?.slug ?? null} />

        <div className="ws-side-foot">
          <Link className="ws-user" href="/dashboard/profile">
            <span className="ws-user-avatar">{initials(user.name)}</span>
            <span className="ws-user-copy">
              <strong>{user.name ?? "Member"}</strong>
              <small>{user.email}</small>
            </span>
          </Link>
          <div className="ws-side-links">
            <Link href="/dashboard/settings">Settings</Link>
            <span>/</span>
            <Link href="/dashboard/security">Security</Link>
            <span>/</span>
            <Link href="/app">Mobile</Link>
          </div>
          <form action={dashboardSignOut}>
            <button className="ws-signout" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="ws-workspace">
        <header className="ws-topbar">
          <Link className="ws-mobile-brand" href="/dashboard" aria-label="TrustBridge workspace">
            <span className="ws-brand-mark">T</span>
          </Link>
          <WorkspaceCrumb role={roleLabel} />

          <div className="ws-top-actions">
            <LiveRefresher />
            <form className="ws-search" action="/dashboard/deals" role="search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input name="q" type="search" placeholder="Search deals, people, deals IDs" aria-label="Search workspace" />
              <span className="ws-kbd">/</span>
            </form>

            <Link className="ws-btn ws-btn-ghost" href="/dashboard/new">
              New deal
            </Link>

            <Link className="ws-icon-btn" href="/dashboard/notifications" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
                <path d="M10.5 20a2 2 0 0 0 3 0" />
              </svg>
              {attention > 0 && <span className="ws-dot-badge" />}
            </Link>

            <details className="ws-user-menu">
              <summary aria-label="Account menu">
                <span className="ws-menu-avatar">{initials(user.name)}</span>
              </summary>
              <div className="ws-menu-panel">
                <div className="ws-menu-head">
                  <strong>{user.name ?? "Member"}</strong>
                  <small>{user.email}</small>
                </div>
                <Link href="/dashboard/profile">
                  Profile <span aria-hidden="true">↗</span>
                </Link>
                <Link href="/dashboard/settings">
                  Settings <span aria-hidden="true">↗</span>
                </Link>
                <Link href="/dashboard/payments">
                  Payments <span aria-hidden="true">↗</span>
                </Link>
                {user.sellerProfile && (
                  <Link href={`/seller/${user.sellerProfile.slug}`}>
                    Public seller page <span aria-hidden="true">↗</span>
                  </Link>
                )}
                <form action={dashboardSignOut}>
                  <button className="ws-menu-danger" type="submit">
                    Sign out <span aria-hidden="true">↗</span>
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>

        <DashNav dealCount={dealCount} attentionCount={attention} sellerSlug={user.sellerProfile?.slug ?? null} mobile />

        <main className="ws-content">
          {children}
          <p className="ws-footer-note">
            {disputes > 0
              ? `${disputes} open ${disputes === 1 ? "dispute" : "disputes"} · human review in progress`
              : "No open disputes · every decision stays on the record"}
          </p>
        </main>
      </div>
    </div>
  );
}
