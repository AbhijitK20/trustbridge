import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import SellerReport from "./seller-report";

export default async function SellerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const profile = await prisma.sellerProfile.findUnique({
    where: { slug: (await params).slug },
    select: {
      slug: true,
      userId: true,
      bio: true,
      completedDeals: true,
      averageRating: true,
      trustScore: true,
      isVerified: true,
      verificationMethod: true,
      verificationDomain: true,
      user: { select: { name: true, image: true } },
      kyc: {
        select: {
          legalName: true,
          entityType: true,
          kycStatus: true,
          sanctionsStatus: true,
          payoutAccountLast4: true,
          payoutBankName: true,
          payoutVerifiedAt: true,
        },
      },
      ratings: { orderBy: { createdAt: "desc" }, take: 8, select: { score: true, comment: true } },
      reports: { where: { status: { in: ["OPEN", "REVIEWING"] } }, select: { id: true, reason: true } },
    },
  });
  if (!profile) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === profile.userId;
  const rating = Number(profile.averageRating);
  const kyc = profile.kyc;

  return (
    <main className="seller-page">
      <nav className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">T</span> trustbridge</Link>
        <Link className="nav-cta" href="/create">Create a deal ↗</Link>
      </nav>

      <section className="seller-hero">
        <p className="eyebrow">Seller profile</p>
        <div className="seller-avatar">{(profile.user.name ?? profile.slug).slice(0, 1).toUpperCase()}</div>
        <h1>{profile.user.name ?? profile.slug}</h1>
        <p>{profile.bio ?? "A TrustBridge seller building a track record one protected deal at a time."}</p>

        {kyc?.legalName && (
          <p className="seller-legal-name">
            Legal name: {kyc.legalName}
            {kyc.entityType ? ` · ${kyc.entityType.replaceAll("_", " ").toLowerCase()}` : ""}
          </p>
        )}

        <div className="trust-badge"><strong>{profile.trustScore}</strong><span>Trust score<br /><small>based on verified history</small></span></div>

        {kyc?.kycStatus === "VERIFIED" ? (
          <div className="verified-seller-badge">
            <span>✓</span> Verified seller · KYC + payout
            {kyc.payoutAccountLast4 ? ` · ${kyc.payoutBankName ?? "bank"} ending ${kyc.payoutAccountLast4}` : ""}
          </div>
        ) : kyc?.kycStatus === "PENDING" ? (
          <div className="verified-seller-badge verified-pending"><span>!</span> Verification pending · compliance review</div>
        ) : profile.isVerified ? (
          <div className="verified-seller-badge"><span>✓</span> Email/domain verified · KYC not started</div>
        ) : null}

        {isOwner && <Link className="text-link seller-verify-link" href="/seller/verify">Verify your seller profile <span>↗</span></Link>}
      </section>

      <section className="seller-stats">
        <div><strong>{profile.completedDeals}</strong><span>completed deals</span></div>
        <div><strong>{rating ? `${rating.toFixed(1)} / 5` : "New"}</strong><span>buyer rating</span></div>
        <div><strong>{profile.reports.length}</strong><span>open reports</span></div>
      </section>

      <section className="seller-reviews">
        <p className="eyebrow">Verified buyer feedback</p>
        {profile.ratings.length === 0 ? (
          <p className="muted">No completed-deal ratings yet.</p>
        ) : (
          profile.ratings.map((item, index) => (
            <article key={index}>
              <span className="stars">{"★".repeat(item.score)}{"☆".repeat(5 - item.score)}</span>
              <p>{item.comment ?? "Completed a protected deal."}</p>
            </article>
          ))
        )}
      </section>

      {profile.reports.length > 0 && (
        <section className="seller-warning">
          <p className="eyebrow">Community reports</p>
          <p>This seller has open reports under review. Read the agreement carefully and keep payment inside TrustBridge.</p>
        </section>
      )}

      <SellerReport slug={profile.slug} />
    </main>
  );
}
