import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { demoModeEnabled } from "@/lib/demo-mode";
import { demoSignIn, demoSignOut } from "./actions";
import AuthForm from "./auth-form";

const errorMessages: Record<string, string> = {
  "demo-disabled": "Workspace access is disabled in this environment.",
  "invalid-credentials": "Email or password is incorrect.",
  "missing-fields": "Enter your email and password.",
  "invalid-email": "Enter a valid email address.",
  "weak-password": "Use a password with at least 8 characters.",
  "account-exists": "An account with this email already exists. Sign in instead.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await auth();
  const { next, error } = await searchParams;
  const nextPath = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  if (session?.user && nextPath && !nextPath.startsWith("/signin")) redirect(nextPath);
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const demoEnabled = demoModeEnabled();
  const errorMessage = error
    ? errorMessages[error] ?? "Sign-in failed. Try again or use another method."
    : null;

  const googleForm = googleEnabled ? (
    <form
      action={async (formData: FormData) => {
        "use server";
        const requested = formData.get("next");
        const safeNext =
          typeof requested === "string" && requested.startsWith("/") && !requested.startsWith("//")
            ? requested
            : "/dashboard";
        await signIn("google", { redirectTo: safeNext });
      }}
    >
      <input type="hidden" name="next" value={nextPath ?? ""} />
      <button className="auth-google" type="submit">
        Continue with Google
      </button>
    </form>
  ) : null;

  return (
    <main className="form-page">
      <div className="form-intro">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span> trustbridge
        </Link>
        <p className="eyebrow">Your protected workspace</p>
        <h1>
          Keep your deals
          <br />
          <em>close.</em>
        </h1>
        <p>Sign in to create agreements, submit delivery, and keep a clear record of every decision.</p>
      </div>

      <div className="deal-form auth-card">
        {session?.user && (
          <div className="signed-in-note">
            <p className="workflow-title">Signed in as {session.user.email}</p>
            <div className="signed-in-actions">
              <Link className="button-primary form-submit" href="/dashboard">
                Go to dashboard
              </Link>
              <form action={demoSignOut}>
                <button className="button-light form-submit" type="submit">
                  Sign out
                </button>
              </form>
            </div>
            <div className="form-divider" />
          </div>
        )}

        {errorMessage && <p className="form-error auth-error">{errorMessage}</p>}

        <AuthForm next={nextPath ?? ""} google={googleForm} />

        {!googleEnabled && (
          <p className="form-footnote auth-hint">
            Google sign-in is not configured for this deployment.
          </p>
        )}

        {demoEnabled && (
          <div className="auth-demo">
            <div className="auth-divider">
              <span>demo seats</span>
            </div>
            <p className="auth-demo-title">Open a demo portal</p>
            <p className="auth-demo-copy">
              One click. No account needed. Pick the role you want to inspect.
            </p>
            <div className="portal-grid">
              <form action={demoSignIn.bind(null, "buyer")}>
                <input type="hidden" name="next" value={nextPath ?? ""} />
                <button className="portal-card" type="submit">
                  <span className="portal-role">Buyer</span>
                  <span className="portal-copy">Protect a purchase</span>
                  <span className="portal-arrow">↗</span>
                </button>
              </form>
              <form action={demoSignIn.bind(null, "seller")}>
                <input type="hidden" name="next" value={nextPath ?? ""} />
                <button className="portal-card" type="submit">
                  <span className="portal-role">Seller</span>
                  <span className="portal-copy">Deliver and get paid</span>
                  <span className="portal-arrow">↗</span>
                </button>
              </form>
              <form action={demoSignIn.bind(null, "admin")}>
                <input type="hidden" name="next" value={nextPath ?? ""} />
                <button className="portal-card portal-card-admin" type="submit">
                  <span className="portal-role">Admin</span>
                  <span className="portal-copy">Resolve disputes</span>
                  <span className="portal-arrow">↗</span>
                </button>
              </form>
              <form action={demoSignIn.bind(null, "reviewer")}>
                <input type="hidden" name="next" value={nextPath ?? ""} />
                <button className="portal-card" type="submit">
                  <span className="portal-role">Reviewer</span>
                  <span className="portal-copy">Independent second look</span>
                  <span className="portal-arrow">↗</span>
                </button>
              </form>
            </div>
          </div>
        )}

        <p className="form-footnote auth-legal">
          Verification is unilateral. Protection is bilateral. TrustBridge never claims to be a
          licensed escrow.
        </p>
        <p className="form-footnote">
          <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> ·{" "}
          <Link href="/legal/refunds">Refunds & disputes</Link> ·{" "}
          <Link href="/legal/grievance">Grievance</Link>
        </p>
      </div>
    </main>
  );
}
