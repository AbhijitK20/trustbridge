import Link from "next/link";
import { auth, signIn } from "@/auth";
import { demoModeEnabled } from "@/lib/demo-mode";
import { demoSignIn, demoSignOut } from "./actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await auth();
  const { next, error } = await searchParams;
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const demoEnabled = demoModeEnabled();

  return (
    <main className="form-page">
      <div className="form-intro">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span> trustbridge
        </Link>
        <p className="eyebrow">Your protected workspace</p>
        <h1>Keep your deals<br /><em>close.</em></h1>
        <p>Sign in to create agreements, submit delivery, and keep a clear record of every decision.</p>
      </div>
      <div className="deal-form auth-card">
        {session?.user && (
          <div className="signed-in-note">
            <p className="workflow-title">Signed in as {session.user.email}</p>
            <form action={demoSignOut}>
              <button className="button-danger form-submit" type="submit">Sign out</button>
            </form>
            <div className="form-divider" />
          </div>
        )}

        {error && (
          <p className="form-error">
            {error === "demo-disabled"
              ? "Workspace access is disabled in this environment."
              : "Sign-in failed. Try again or use another method."}
          </p>
        )}

        {demoEnabled && (
          <>
            <p className="workflow-title">Workspace access</p>
            <p className="form-footnote demo-footnote">
              One click. No Google account. Open a buyer, seller, admin, or reviewer workspace.
            </p>
            <div className="demo-buttons">
              <form action={demoSignIn.bind(null, "buyer")}>
                <input type="hidden" name="next" value={next ?? ""} />
                <button className="button-primary form-submit" type="submit">Continue as buyer <span>↗</span></button>
              </form>
              <form action={demoSignIn.bind(null, "seller")}>
                <input type="hidden" name="next" value={next ?? ""} />
                <button className="button-light form-submit demo-secondary" type="submit">Continue as seller <span>↗</span></button>
              </form>
              <form action={demoSignIn.bind(null, "admin")}>
                <input type="hidden" name="next" value={next ?? ""} />
                <button className="button-primary form-submit demo-admin" type="submit">Open the admin dispute desk <span>↗</span></button>
              </form>
              <form action={demoSignIn.bind(null, "reviewer")}>
                <input type="hidden" name="next" value={next ?? ""} />
                <button className="button-light form-submit demo-secondary" type="submit">Open second reviewer desk <span>↗</span></button>
              </form>
            </div>
          </>
        )}

        {googleEnabled && (
          <>
            <div className="form-divider" />
            <form
              action={async (formData: FormData) => {
                "use server";
                const requested = formData.get("next");
                const safeNext = typeof requested === "string" && requested.startsWith("/") ? requested : "/create";
                await signIn("google", { redirectTo: safeNext });
              }}
            >
              <input type="hidden" name="next" value={next ?? ""} />
              <button className="button-primary form-submit" type="submit">Continue with Google <span>↗</span></button>
            </form>
          </>
        )}

        {!demoEnabled && !googleEnabled && (
          <p className="form-error">
            No sign-in provider is configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET, or enable workspace access for this deployment.
          </p>
        )}

        <p className="form-footnote">
          Verification is unilateral. Protection is bilateral. TrustBridge never claims to be a licensed escrow.
        </p>
        <p className="form-footnote">
          <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/refunds">Refunds & disputes</Link> · <Link href="/legal/grievance">Grievance</Link>
        </p>
      </div>
    </main>
  );
}
