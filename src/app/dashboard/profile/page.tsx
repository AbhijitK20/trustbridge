import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateProfile } from "../actions";

function initials(name: string | null | undefined) {
  if (!name) return "TB";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function DashboardProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { sellerProfile: { include: { kyc: true } } },
  });
  if (!user) redirect("/signin");

  const params = await searchParams;
  const seller = user.sellerProfile;
  const kyc = seller?.kyc;
  const isVerified = Boolean(seller?.isVerified);
  const payoutReady = Boolean(kyc?.payoutAccountLast4);

  const checklist = [
    { done: Boolean(user.emailVerified), label: "Email verified", note: user.email },
    { done: Boolean(user.name), label: "Display name set", note: user.name ?? "Add a name buyers will recognise" },
    { done: Boolean(seller), label: "Seller profile", note: seller ? "Payouts can be routed" : "Create one when you start selling" },
    { done: payoutReady, label: "Payout account linked", note: payoutReady ? `${kyc?.payoutBankName ?? "Bank"} ending ${kyc?.payoutAccountLast4}` : "Required before the first payout" },
    { done: isVerified, label: "Verified seller badge", note: isVerified ? "Shown on every protected deal" : "Complete verification to earn it" },
  ];

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Account · profile</p>
          <h1>
            Your name <em>on the record.</em>
          </h1>
          <p>
            Buyers see your verified seller name on every protected deal. Keep the display name and
            payout identity accurate.
          </p>
        </div>
        <div className="ws-head-actions">
          {seller && (
            <Link className="ws-btn ws-btn-ghost" href={`/seller/${seller.slug}`}>
              Public page <i>↗</i>
            </Link>
          )}
          <Link className="ws-btn" href="/dashboard/settings">
            Settings <i>↗</i>
          </Link>
        </div>
      </header>

      {params.saved && <div className="ws-banner ws-banner-ok">Profile updated.</div>}
      {params.error && <div className="ws-banner ws-banner-error">Enter a name between 2 and 80 characters.</div>}

      <div className="ws-profile-grid">
        <aside className="ws-panel">
          <div className="ws-identity">
            <div className="ws-identity-avatar">{initials(user.name)}</div>
            <h2>{user.name ?? "TrustBridge member"}</h2>
            <p>{user.email}</p>
            <div className="ws-chip-row">
              <span className="ws-chip">{user.role.replaceAll("_", " ").toLowerCase()}</span>
              {isVerified ? (
                <span className="ws-chip ws-chip-verified">verified seller</span>
              ) : seller ? (
                <span className="ws-chip">verification pending</span>
              ) : (
                <span className="ws-chip">buyer only</span>
              )}
            </div>

            <div className="ws-identity-facts">
              <div className="ws-fact">
                <span>Member since</span>
                <strong>
                  {user.createdAt.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </strong>
              </div>
              <div className="ws-fact">
                <span>Deals completed</span>
                <strong>{seller?.completedDeals ?? 0}</strong>
              </div>
              <div className="ws-fact">
                <span>Trust score</span>
                <strong>{seller ? seller.trustScore : "—"}</strong>
              </div>
              <div className="ws-fact">
                <span>Sign-in</span>
                <strong>Google</strong>
              </div>
            </div>
          </div>
        </aside>

        <div className="ws-settings-stack">
          <section className="ws-panel" id="identity">
            <div className="ws-panel-head">
              <div>
                <small>Profile</small>
                <h2>Display identity</h2>
              </div>
              <span className="ws-row-note">Visible in the workspace</span>
            </div>
            <div className="ws-panel-body">
              <form action={updateProfile} className="ws-form">
                <div className="ws-form-two">
                  <div className="ws-form-row">
                    <label htmlFor="name">Display name</label>
                    <input
                      id="name"
                      name="name"
                      defaultValue={user.name ?? ""}
                      minLength={2}
                      maxLength={80}
                      required
                    />
                    <small>Shown in the workspace. Seller payouts use the verified legal name.</small>
                  </div>
                  <div className="ws-form-row">
                    <label htmlFor="email">Login email</label>
                    <input id="email" value={user.email} readOnly />
                    <small>Email changes are handled through Google sign-in.</small>
                  </div>
                </div>
                <div className="ws-form-foot">
                  <button className="ws-btn" type="submit">
                    Save profile
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="ws-panel">
            <div className="ws-panel-head">
              <div>
                <small>Readiness</small>
                <h2>Account checklist</h2>
              </div>
              <span className="ws-row-note">
                {checklist.filter((item) => item.done).length}/{checklist.length} complete
              </span>
            </div>
            <div className="ws-panel-body">
              <div className="ws-checklist">
                {checklist.map((item) => (
                  <div className="ws-check-item" key={item.label}>
                    <span className={`ws-check-icon ${item.done ? "" : "is-todo"}`}>
                      {item.done ? "✓" : "→"}
                    </span>
                    <span className="ws-check-copy">
                      <strong>{item.label}</strong>
                      <small>{item.note}</small>
                    </span>
                    <span className="ws-task-action">{item.done ? "Done" : "Open"}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {seller && (
            <section className="ws-panel">
              <div className="ws-panel-head">
                <div>
                  <small>Seller identity</small>
                  <h2>Legal name & payout</h2>
                </div>
                <Link href="/seller/verify">
                  {isVerified ? "Review" : "Complete verification"}
                </Link>
              </div>
              <div className="ws-panel-body">
                <div className="ws-grid-3" style={{ marginTop: 0 }}>
                  <div>
                    <span className="ws-kpi-label">KYC status</span>
                    <strong className="ws-kpi-value" style={{ fontSize: 18, display: "block" }}>
                      {kyc?.kycStatus?.replaceAll("_", " ").toLowerCase() ?? "Not started"}
                    </strong>
                    <span className="ws-kpi-note">{kyc?.legalName ?? "No legal name submitted"}</span>
                  </div>
                  <div>
                    <span className="ws-kpi-label">Payout account</span>
                    <strong className="ws-kpi-value" style={{ fontSize: 18, display: "block" }}>
                      {kyc?.payoutBankName ?? "Not linked"}
                    </strong>
                    <span className="ws-kpi-note">
                      {kyc?.payoutAccountLast4
                        ? `Account ending ${kyc.payoutAccountLast4}`
                        : "Complete payout verification"}
                    </span>
                  </div>
                  <div>
                    <span className="ws-kpi-label">Sanctions</span>
                    <strong className="ws-kpi-value" style={{ fontSize: 18, display: "block" }}>
                      {kyc?.sanctionsStatus?.replaceAll("_", " ").toLowerCase() ?? "Pending"}
                    </strong>
                    <span className="ws-kpi-note">Re-screened when payout details change</span>
                  </div>
                </div>
                <hr className="ws-divider" />
                <p className="ws-note">
                  Payouts go only to the verified legal name above. TrustBridge never asks for full
                  bank credentials in chat.
                </p>
              </div>
            </section>
          )}

          <section className="ws-panel">
            <div className="ws-panel-head">
              <div>
                <small>Shortcuts</small>
                <h2>Related account pages</h2>
              </div>
            </div>
            <div className="ws-panel-body ws-panel-body-flush">
              <Link className="ws-task" href="/dashboard/settings">
                <span className="ws-task-mark">⚙</span>
                <span className="ws-task-copy">
                  <strong>Preferences</strong>
                  <small>Timezone, currency, and email updates</small>
                </span>
                <span className="ws-task-action">Open</span>
              </Link>
              <Link className="ws-task" href="/dashboard/security">
                <span className="ws-task-mark">◈</span>
                <span className="ws-task-copy">
                  <strong>Security</strong>
                  <small>Sessions, sign-in method, and device control</small>
                </span>
                <span className="ws-task-action">Open</span>
              </Link>
              <Link className="ws-task" href="/app">
                <span className="ws-task-mark">▤</span>
                <span className="ws-task-copy">
                  <strong>Mobile workspace</strong>
                  <small>The same record, sized for a phone</small>
                </span>
                <span className="ws-task-action">Open</span>
              </Link>
              <Link className="ws-task" href="/legal/privacy">
                <span className="ws-task-mark">§</span>
                <span className="ws-task-copy">
                  <strong>Privacy notice</strong>
                  <small>What we store and why</small>
                </span>
                <span className="ws-task-action">Read</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
