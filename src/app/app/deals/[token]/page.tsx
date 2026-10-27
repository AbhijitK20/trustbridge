import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPublicDeal } from "@/lib/deals";
import { getDealTimeline } from "@/lib/timeline";
import DealActions from "@/app/deal/[token]/deal-actions";
import DealExtras from "@/app/deal/[token]/deal-extras";
import DealTimeline from "@/app/deal/[token]/timeline";
import ShareDeal from "@/app/deal/[token]/share-deal";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

export default async function AppDealPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?next=/app/deals/${token}`);
  const deal = await getPublicDeal(token);
  if (!deal) notFound();
  const participant = await prisma.deal.findUnique({
    where: { publicToken: token },
    select: { buyerId: true, sellerId: true },
  });
  const isBuyer = participant?.buyerId === session.user.id;
  const isSeller = participant?.sellerId === session.user.id;
  if (!isBuyer && !isSeller) redirect(`/deal/${token}`);

  const timeline = await getDealTimeline(deal.id, deal.createdAt);
  const sellerKyc = deal.sellerProfile.kyc;
  const sellerName = sellerKyc?.legalName ?? deal.sellerProfile.user.name ?? deal.sellerProfile.slug;
  const verificationOutcome = deal.verificationCheck?.outcome ?? null;
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/deal/${deal.publicToken}`;
  const demoMode = process.env.DEMO_MODE === "true";

  return (
    <div className="app-page app-deal-page">
      <Link className="app-back" href="/app/deals">
        ← All deals
      </Link>

      <header className="app-deal-head">
        <div className="app-deal-head-top">
          <span className={`app-status app-status-${deal.status.toLowerCase()}`}>
            {statusLabel(deal.status)}
          </span>
          <span className="app-deal-ref">#{deal.publicToken.slice(-6).toUpperCase()}</span>
        </div>
        <h1>{deal.title}</h1>
        <p>{deal.description}</p>
        <div className="app-deal-money">
          <strong>{money(deal.priceCents, deal.currency)}</strong>
          <span>protected total</span>
        </div>
      </header>

      <section className="app-deal-facts">
        <div>
          <span>Seller</span>
          <strong>{sellerName}</strong>
          <small>
            {sellerKyc?.kycStatus === "VERIFIED" ? "Verified seller" : "Identity pending"}
          </small>
        </div>
        <div>
          <span>Delivery</span>
          <strong>
            {deal.deliveryDeadline
              ? new Date(deal.deliveryDeadline).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "To be agreed"}
          </strong>
          <small>{deal.milestones.length > 0 ? `${deal.milestones.length} milestones` : "Single delivery"}</small>
        </div>
      </section>

      <DealExtras
        token={deal.publicToken}
        currency={deal.currency}
        milestones={deal.milestones.map((milestone) => ({
          id: milestone.id,
          position: milestone.position,
          title: milestone.title,
          description: milestone.description,
          acceptanceCriteria: milestone.acceptanceCriteria,
          amountCents: milestone.amountCents,
          dueAt: milestone.dueAt?.toISOString() ?? null,
          status: milestone.status,
          verificationRequired: milestone.verificationRequired,
          submissionNote: milestone.submissionNote,
          reviewNote: milestone.reviewNote,
          submittedAt: milestone.submittedAt?.toISOString() ?? null,
          releasedAt: milestone.releasedAt?.toISOString() ?? null,
        }))}
        isBuyer={Boolean(isBuyer)}
        isSeller={Boolean(isSeller)}
        verificationOutcome={verificationOutcome}
        demoMode={demoMode}
        contract={
          deal.contract
            ? {
                number: deal.contract.number,
                status: deal.contract.status,
                contentHash: deal.contract.contentHash,
              }
            : null
        }
      />

      <DealActions
        token={deal.publicToken}
        status={deal.status}
        isSeller={Boolean(isSeller)}
        isBuyer={Boolean(isBuyer)}
        demoMode={demoMode}
        hasMilestones={deal.milestones.length > 0}
      />

      <DealTimeline items={timeline} />

      <section className="app-share">
        <ShareDeal url={shareUrl} title={deal.title} />
      </section>

      <Link className="app-outline-link" href={`/deal/${deal.publicToken}`}>
        Open the full deal page ↗
      </Link>
    </div>
  );
}
