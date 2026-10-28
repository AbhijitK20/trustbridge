import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { daysSince } from "@/lib/time";
import { dashboardSignOut } from "../actions";

export default async function DashboardSecurityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/security");

  const [user, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        emailVerified: true,
        createdAt: true,
        accounts: { select: { provider: true } },
      },
    }),
    prisma.session.count({ where: { userId: session.user.id } }),
  ]);
  if (!user) redirect("/signin");

  const providers = user.accounts.map((account) => account.provider);
  const hasGoogle = providers.includes("google");
  const hasPassword = providers.includes("credentials");
  const providerLabel = hasPassword ? (hasGoogle ? "Google + password" : "Email & password") : "Google";
  const memberDays = daysSince(new Date(user.createdAt));

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Account · security</p>
          <h1>
            Keep the keys <em>close.</em>
          </h1>
          <p>
            {hasPassword
            ? "TrustBridge signs you in with email and password, or Google when connected. Passwords are stored as scrypt hashes, never in plain text."
            : "TrustBridge uses Google sign-in. We never store a TrustBridge password or full payment credentials."}
          </p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn ws-btn-ghost" href="/dashboard/settings">
            Preferences <i>↗</i>
          </Link>
        </div>
      </header>

      <section className="ws-kpis">
        <div className="ws-kpi">
          <span className="ws-kpi-label">Sign-in method</span>
          <span className="ws-kpi-value" style={{ textTransform: "capitalize" }}>
            {providerLabel}
          </span>
          <span className="ws-kpi-note">{user.email}</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Email verified</span>
          <span className="ws-kpi-value">{user.emailVerified ? "Yes" : hasGoogle ? "Via Google" : "Not verified"}</span>
          <span className="ws-kpi-note">{hasGoogle ? "Linked to a verified Google identity" : "Set when the account was created"}</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Active sessions</span>
          <span className="ws-kpi-value">{sessions}</span>
          <span className="ws-kpi-note">Across browsers and devices</span>
        </div>
        <div className="ws-kpi ws-kpi-dark">
          <span className="ws-kpi-label">Account age</span>
          <span className="ws-kpi-value">{memberDays}</span>
          <span className="ws-kpi-note">Days on the record</span>
        </div>
      </section>

      <div className="ws-grid-2">
        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Session control</small>
              <h2>This device</h2>
            </div>
            <span className="ws-status ws-status-released">
              <i /> Current
            </span>
          </div>
          <div className="ws-panel-body">
            <div className="ws-fact">
              <span>Browser session</span>
              <strong>Active now</strong>
            </div>
            <div className="ws-fact">
              <span>Other sessions</span>
              <strong>{sessions > 1 ? (hasGoogle ? `${sessions - 1} managed by Google` : `${sessions - 1} other session(s)`) : "None"}</strong>
            </div>
            <div className="ws-fact">
              <span>Session control</span>
              <strong>Sign out ends this browser only</strong>
            </div>
            <hr className="ws-divider" />
            <p className="ws-note">
              {hasGoogle
                ? "Use this on a shared computer. Other active sessions are managed from your Google account security page."
                : "Use this on a shared computer. Signing in again ends the previous session on the record."}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <form action={dashboardSignOut}>
                <button className="ws-btn" type="submit">
                  Sign out
                </button>
              </form>
              {hasGoogle ? (
                <Link
                  className="ws-btn ws-btn-ghost"
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google security <i>↗</i>
                </Link>
              ) : (
                <Link className="ws-btn ws-btn-ghost" href="/dashboard/settings">
                  Account settings <i>↗</i>
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Data handling</small>
              <h2>What we never store</h2>
            </div>
          </div>
          <div className="ws-panel-body">
            <div className="ws-checklist">
              <div className="ws-check-item">
                <span className="ws-check-icon">✓</span>
                <span className="ws-check-copy">
                  <strong>{hasPassword ? "No plaintext password" : "No TrustBridge password"}</strong>
                  <small>
                    {hasPassword
                      ? "Passwords are stored as scrypt hashes with a random salt."
                      : "Authentication is delegated to Google OAuth."}
                  </small>
                </span>
              </div>
              <div className="ws-check-item">
                <span className="ws-check-icon">✓</span>
                <span className="ws-check-copy">
                  <strong>No full card or bank numbers</strong>
                  <small>Payment partners hold the credentials. We keep last four and status only.</small>
                </span>
              </div>
              <div className="ws-check-item">
                <span className="ws-check-icon">✓</span>
                <span className="ws-check-copy">
                  <strong>No chat-only decisions</strong>
                  <small>Every decision carries evidence and an audit entry.</small>
                </span>
              </div>
            </div>
            <hr className="ws-divider" />
            <p className="ws-note">
              Account created{" "}
              {user.createdAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . Payout changes trigger re-screening.
            </p>
          </div>
        </section>
      </div>

      <section className="ws-panel" style={{ marginTop: 12 }}>
        <div className="ws-panel-head">
          <div>
            <small>Audit</small>
            <h2>Security expectations</h2>
          </div>
          <Link href="/legal/terms">Terms</Link>
        </div>
        <div className="ws-panel-body">
          <div className="ws-grid-3" style={{ marginTop: 0 }}>
            <div>
              <span className="ws-kpi-label">Evidence access</span>
              <p className="ws-split-note" style={{ marginTop: 6 }}>
                Only the two sides of a deal, plus a reviewer with a case, can read the evidence.
              </p>
            </div>
            <div>
              <span className="ws-kpi-label">Payout changes</span>
              <p className="ws-split-note" style={{ marginTop: 6 }}>
                Changing a payout account re-runs sanctions screening and pauses payouts.
              </p>
            </div>
            <div>
              <span className="ws-kpi-label">Disputes</span>
              <p className="ws-split-note" style={{ marginTop: 6 }}>
                A human decision is recorded with a note; nothing is decided silently.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
