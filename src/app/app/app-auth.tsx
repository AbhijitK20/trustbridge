import Link from "next/link";
import { signIn } from "@/auth";
import { demoModeEnabled } from "@/lib/demo-mode";
import { demoSignIn, passwordSignIn, passwordSignUp } from "@/app/signin/actions";
import NextPath from "./next-path";

export default async function AppAuth() {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const demoEnabled = demoModeEnabled();

  return (
    <div className="app-shell">
      <div className="app-phone app-auth-phone">
        <header className="app-topbar">
          <Link className="app-brand" href="/app">
            <span className="brand-mark">T</span>
            <span>
              trustbridge
              <small>protected workspace</small>
            </span>
          </Link>
        </header>

        <main className="app-main app-auth-main">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> Your protected workspace
          </p>
          <h1 className="app-auth-title">
            Open your
            <br />
            <em>workspace.</em>
          </h1>
          <p className="app-auth-sub">
            Sign in to check an offer, protect a deal, and keep the record in one place.
          </p>

          <div className="app-auth-card">
            {googleEnabled && (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/app" });
                }}
              >
                <button className="app-auth-google" type="submit">Continue with Google</button>
              </form>
            )}

            <div className="app-auth-divider"><span>or use email</span></div>

            <form className="app-auth-form">
              <label htmlFor="app-email">Email address</label>
              <input id="app-email" name="email" type="email" placeholder="you@gmail.com" autoComplete="email" required />
              <label htmlFor="app-password">Password</label>
              <input id="app-password" name="password" type="password" placeholder="At least 8 characters" autoComplete="current-password" minLength={8} required />
              <NextPath />
              <div className="app-auth-actions">
                <button className="app-auth-primary" type="submit" formAction={passwordSignIn}>Sign in</button>
                <button className="app-auth-secondary" type="submit" formAction={passwordSignUp}>Create account</button>
              </div>
              <p className="app-auth-hint">New here? Enter an email and password, then choose Create account.</p>
            </form>

            {demoEnabled && (
              <>
                <div className="app-auth-divider"><span>or open a demo portal</span></div>
                <div className="app-auth-portals">
                  <form action={demoSignIn.bind(null, "buyer")}>
                    <NextPath />
                    <button className="app-auth-portal" type="submit">
                      <span>Buyer</span>
                      <strong>Protect a purchase</strong>
                      <i>↗</i>
                    </button>
                  </form>
                  <form action={demoSignIn.bind(null, "seller")}>
                    <NextPath />
                    <button className="app-auth-portal" type="submit">
                      <span>Seller</span>
                      <strong>Deliver and get paid</strong>
                      <i>↗</i>
                    </button>
                  </form>
                  <form action={demoSignIn.bind(null, "admin")}>
                    <button className="app-auth-portal app-auth-portal-admin" type="submit">
                      <span>Admin</span>
                      <strong>Resolve disputes</strong>
                      <i>↗</i>
                    </button>
                  </form>
                  <form action={demoSignIn.bind(null, "reviewer")}>
                    <button className="app-auth-portal" type="submit">
                      <span>Reviewer</span>
                      <strong>Independent second look</strong>
                      <i>↗</i>
                    </button>
                  </form>
                </div>
              </>
            )}

            {!googleEnabled && <p className="app-auth-hint">Google sign-in is not configured. Use email or a demo portal.</p>}
          </div>
        </main>
      </div>
    </div>
  );
}
