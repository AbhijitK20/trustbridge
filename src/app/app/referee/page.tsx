import type { Metadata } from "next";
import RefereeChat from "@/app/referee/referee-chat";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Referee chat | TrustBridge",
  description: "Paste an offer. Get a four-state verdict, the conditions, and a reply you can send.",
};

export default function AppRefereePage() {
  return (
    <div className="app-page app-referee">
      <header className="app-page-head app-check-head">
        <p className="eyebrow">
          <span className="eyebrow-dot" /> The deal referee
        </p>
        <h1>
          Say it in chat.
          <br />
          <em>Check it in chat.</em>
        </h1>
        <p>
          Paste the offer, the email, or the link. TrustBridge separates the claim from the evidence
          and tells you what it still cannot determine.
        </p>
      </header>
      <RefereeChat />
    </div>
  );
}
