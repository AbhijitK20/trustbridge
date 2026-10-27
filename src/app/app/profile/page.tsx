import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { appSignOut } from "./actions";

function initials(name: string | null | undefined) {
  if (!name) return "TB";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function AppProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      sellerProfile: {
        select: {
          slug: true,
          isVerified: true,
          trustScore: true,
          completedDeals: true,
          kyc: {
            select: {
              kycStatus: true,
              legalName: true,
              payoutBankName: true,
              payoutAccountLast4: true,
              payoutVerifiedAt: true,
            },
          },
        },
      },
    },
  });
  const kyc = user?.sellerProfile?.kyc;

  return (
    <div className="app-page">
      <header className="app-page-head">
        <p className="eyebrow">
          <span className="eyebrow-dot" /> Your account
        </p>
        <h1>
          Your corner
          <br />
          <em>of the record.</em>
        </h1>
        <p>Identity, payout readiness, and the rules you are agreeing to.</p>
      </header>

      <section className="app-profile-card">
        <div className="app-profile-avatar">{initials(user?.name)}</div>
        <div>
          <h2>{user?.name ?? "TrustBridge member"}</h2>
          <p>{user?.email}</p>
          <span className="app-role-chip">{user?.role.replaceAll("_", " ").toLowerCase()}</span>
        </div>
      </section>

      {user?.role === "SELLER" && user.sellerProfile && (
        <section className="app-info-card">
          <p className="card-label">SELLER IDENTITY</p>
          <div className="app-info-row">
            <span>KYC status</span>
            <strong>{kyc?.kycStatus.replaceAll("_", " ").toLowerCase() ?? "not started"}</strong>
          </div>
          <div className="app-info-row">
            <span>Legal name</span>
            <strong>{kyc?.legalName ?? "Not provided"}</strong>
          </div>
          <div className="app-info-row">
            <span>Payout account</span>
            <strong>
              {kyc?.payoutBankName ?? "Not linked"}{" "}
              {kyc?.payoutAccountLast4 ? `ending ${kyc.payoutAccountLast4}` : ""}
            </strong>
          </div>
          <div className="app-info-row">
            <span>Verified seller</span>
            <strong>{user.sellerProfile.isVerified ? "Yes" : "Pending"}</strong>
          </div>
          <Link className="app-outline-link" href="/seller/verify">
            {kyc?.kycStatus === "VERIFIED" ? "Review verification" : "Complete verification"} ↗
          </Link>
        </section>
      )}

      <section className="app-info-card">
        <p className="card-label">WORKSPACE</p>
        <Link className="app-link-row" href="/dashboard">
          <span>Buyer / seller dashboard</span>
          <span>↗</span>
        </Link>
        <Link className="app-link-row" href="/app/deals">
          <span>All deals</span>
          <span>↗</span>
        </Link>
        <Link className="app-link-row" href="/create">
          <span>Start a protected deal</span>
          <span>↗</span>
        </Link>
        <Link className="app-link-row" href="/demo/whatsapp">
          <span>WhatsApp referee</span>
          <span>↗</span>
        </Link>
        <Link className="app-link-row" href="/check">
          <span>Full verification workspace</span>
          <span>↗</span>
        </Link>
      </section>

      <section className="app-info-card">
        <p className="card-label">THE FINE PRINT</p>
        <Link className="app-link-row" href="/legal/terms">
          <span>Terms</span>
          <span>↗</span>
        </Link>
        <Link className="app-link-row" href="/legal/privacy">
          <span>Privacy</span>
          <span>↗</span>
        </Link>
        <Link className="app-link-row" href="/legal/refunds">
          <span>Refunds & disputes</span>
          <span>↗</span>
        </Link>
        <Link className="app-link-row" href="/legal/grievance">
          <span>Grievance</span>
          <span>↗</span>
        </Link>
      </section>

      <form action={appSignOut}>
        <button className="app-signout" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
