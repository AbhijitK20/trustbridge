import type { Metadata } from "next";
import Link from "next/link";
import CheckForm from "@/app/check/check-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Check an offer | TrustBridge",
  description: "Four-state verification for offers found in chat, email, and job boards.",
};

export default function AppCheckPage() {
  return (
    <div className="app-page app-check">
      <header className="app-page-head app-check-head">
        <p className="eyebrow">
          <span className="eyebrow-dot" /> Verify before you pay
        </p>
        <h1>
          What are you
          <br />
          <em>being asked to believe?</em>
        </h1>
        <p>
          Paste the promise. Add the evidence you have. TrustBridge separates claims from proof and
          tells you what it still cannot determine.
        </p>
        <Link className="app-text-link" href="/app/referee">
          Or talk it through with the referee ↗
        </Link>
      </header>
      <CheckForm />
    </div>
  );
}
