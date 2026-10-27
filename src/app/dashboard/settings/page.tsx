import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dashboardSignOut, updateSettings } from "../actions";
import SettingsSubnav from "../ws-subnav";

export default async function DashboardSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { settings: true, sellerProfile: { select: { isVerified: true } } },
  });
  if (!user) redirect("/signin");

  const settings = user.settings;
  const params = await searchParams;
  const fee = Number(process.env.PLATFORM_FEE_PERCENT ?? 3);

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Account · settings</p>
          <h1>
            Make it <em>yours.</em>
          </h1>
          <p>Timezone, display currency, and the email you want. Only the important signal.</p>
        </div>
      </header>

      {params.saved && <div className="ws-banner ws-banner-ok">Preferences saved.</div>}
      {params.error && <div className="ws-banner ws-banner-error">That preference could not be saved.</div>}

      <div className="ws-settings-grid">
        <SettingsSubnav />

        <div className="ws-settings-stack">
          <form action={updateSettings} className="ws-settings-stack">
            <section className="ws-panel ws-section" id="regional">
              <div className="ws-panel-head">
                <div>
                  <small>Regional</small>
                  <h2>Time and money</h2>
                </div>
                <span className="ws-row-note">Stored with every deal</span>
              </div>
              <div className="ws-panel-body">
                <div className="ws-form-two">
                  <div className="ws-form-row">
                    <label htmlFor="timezone">Timezone</label>
                    <select id="timezone" name="timezone" defaultValue={settings?.timezone ?? "Asia/Kolkata"}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Dubai">Asia/Dubai</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="UTC">UTC</option>
                    </select>
                    <small>Used for deadlines and dispute windows.</small>
                  </div>
                  <div className="ws-form-row">
                    <label htmlFor="currency">Display currency</label>
                    <select id="currency" name="currency" defaultValue={settings?.currency ?? "INR"}>
                      <option value="INR">INR · Indian rupee</option>
                      <option value="USD">USD · US dollar</option>
                      <option value="AED">AED · UAE dirham</option>
                      <option value="GBP">GBP · Pound sterling</option>
                    </select>
                    <small>Deal amounts are stored in their original currency.</small>
                  </div>
                </div>
              </div>
            </section>

            <section className="ws-panel ws-section" id="notifications">
              <div className="ws-panel-head">
                <div>
                  <small>Notifications</small>
                  <h2>What reaches your inbox</h2>
                </div>
                <span className="ws-row-note">{user.email}</span>
              </div>
              <div className="ws-panel-body">
                <div className="ws-toggle-row">
                  <span className="ws-toggle-copy">
                    <strong>Deal activity</strong>
                    <small>Funding, delivery, release, and contract updates.</small>
                  </span>
                  <label className="ws-switch">
                    <input type="checkbox" name="emailDeals" defaultChecked={settings?.emailDeals ?? true} />
                    <span />
                  </label>
                </div>
                <div className="ws-toggle-row">
                  <span className="ws-toggle-copy">
                    <strong>Disputes and decisions</strong>
                    <small>Statements, review windows, and human decisions.</small>
                  </span>
                  <label className="ws-switch">
                    <input type="checkbox" name="emailDisputes" defaultChecked={settings?.emailDisputes ?? true} />
                    <span />
                  </label>
                </div>
                <div className="ws-toggle-row">
                  <span className="ws-toggle-copy">
                    <strong>Product updates</strong>
                    <small>Occasional changes to TrustBridge features. No campaigns.</small>
                  </span>
                  <label className="ws-switch">
                    <input type="checkbox" name="emailProduct" defaultChecked={settings?.emailProduct ?? false} />
                    <span />
                  </label>
                </div>
              </div>
              <div className="ws-form-foot" style={{ padding: "0 18px 16px" }}>
                <button className="ws-btn" type="submit">
                  Save preferences
                </button>
              </div>
            </section>
          </form>

          <section className="ws-panel ws-section" id="workspace">
            <div className="ws-panel-head">
              <div>
                <small>Workspace</small>
                <h2>Account facts</h2>
              </div>
              <Link href="/dashboard/profile">Edit profile</Link>
            </div>
            <div className="ws-panel-body">
              <div className="ws-fact">
                <span>Role</span>
                <strong>{user.role.replaceAll("_", " ").toLowerCase()}</strong>
              </div>
              <div className="ws-fact">
                <span>Sign-in</span>
                <strong>Google · {user.email}</strong>
              </div>
              <div className="ws-fact">
                <span>Protection fee</span>
                <strong>{fee}% · paid by the buyer</strong>
              </div>
              <div className="ws-fact">
                <span>Payment mode</span>
                <strong>Sandbox · no real money</strong>
              </div>
              <div className="ws-fact">
                <span>Seller verification</span>
                <strong>{user.sellerProfile?.isVerified ? "Verified" : "Not verified"}</strong>
              </div>
            </div>
          </section>

          <section className="ws-panel ws-section ws-danger" id="danger">
            <div className="ws-panel-head">
              <div>
                <small>Danger zone</small>
                <h2>Leave or close the workspace</h2>
              </div>
            </div>
            <div className="ws-panel-body">
              <p className="ws-note" style={{ marginBottom: 14 }}>
                Signing out ends this browser session. Account deletion is handled by a human so the
                deal record stays auditable.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <form action={dashboardSignOut}>
                  <button className="ws-btn" type="submit">
                    Sign out
                  </button>
                </form>
                <Link className="ws-btn ws-btn-ghost" href="mailto:abhijitchandrakantkapure@gmail.com?subject=Account%20deletion%20request">
                  Request deletion <i>↗</i>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
