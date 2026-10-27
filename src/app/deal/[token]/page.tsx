import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicDeal } from "@/lib/deals";
import PayButton from "./pay-button";
import DealActions from "./deal-actions";
import RatingForm from "./rating-form";
import DisputeThread from "./dispute-thread";
import DealTimeline from "./timeline";
import ShareDeal from "./share-deal";
import NoticeDraft from "./notice-draft";
import DealExtras from "./deal-extras";
import { getDealTimeline } from "@/lib/timeline";
import LegalFooter from "@/components/legal-footer";
import { legalEntity } from "@/lib/legal";
import { calculatePlatformFee } from "@/lib/stripe";
import { daysUntil } from "@/lib/time";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { CheckResult } from "@/lib/verification";

export default async function PublicDealPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const deal = await getPublicDeal((await params).token);
  if (!deal) notFound();
  const session = await auth();
  const participant = session?.user?.id
    ? await prisma.deal.findUnique({
        where: { publicToken: deal.publicToken },
        select: { buyerId: true, sellerId: true },
      })
    : null;
  const verificationReport = deal.verificationCheck
    ? (deal.verificationCheck.result as unknown as CheckResult)
    : null;
  const viewerId = session?.user?.id ?? null;
  const isBuyer = Boolean(viewerId && participant?.buyerId === viewerId);
  const isSeller = Boolean(viewerId && participant?.sellerId === viewerId);
  const sellerKyc = deal.sellerProfile.kyc;
  const sellerLegalName =
    sellerKyc?.legalName ??
    deal.sellerProfile.user.name ??
    deal.sellerProfile.slug;
  const sellerVerified = sellerKyc?.kycStatus === "VERIFIED";
  const timeline = await getDealTimeline(deal.id, deal.createdAt);
  const openDispute = deal.disputes[0] ?? null;
  const reviewDays = deal.autoReleaseAt
    ? daysUntil(new Date(deal.autoReleaseAt))
    : null;
  const disputeDue = openDispute
    ? new Date(openDispute.createdAt.getTime() + 7 * 86_400_000)
    : null;
  const statements =
    deal.status === "DISPUTED"
      ? await prisma.auditLog.findMany({
          where: { dealId: deal.id, action: "DISPUTE_STATEMENT" },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            metadata: true,
            createdAt: true,
            actor: { select: { name: true, email: true } },
          },
        })
      : [];
  const statementItems = statements.map((event) => {
    const metadata = event.metadata as {
      statement?: string;
      role?: string;
    } | null;
    return {
      id: event.id,
      role: metadata?.role ?? "BUYER",
      statement: metadata?.statement ?? "",
      author: event.actor?.name ?? event.actor?.email ?? "Participant",
      createdAt: event.createdAt.toISOString(),
    };
  });
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/deal/${deal.publicToken}`;
  const platformFee = calculatePlatformFee(deal.priceCents);
  const sellerNet = Math.max(0, deal.priceCents - platformFee);
  const money = (cents: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: deal.currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(cents / 100);
  return (
    <main className="public-deal-page">
      <nav className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span> trustbridge
        </Link>
        <span className="deal-nav-label">Protected deal</span>
      </nav>
      <section className="public-deal-card">
        <div className="deal-card-head">
          <span className="status-pill">
            <b /> {deal.status.replaceAll("_", " ")}
          </span>
          <span className="small-muted">
            #{deal.publicToken.slice(-6).toUpperCase()}
          </span>
        </div>
        <p className="card-label">SERVICE AGREEMENT</p>
        <h1>{deal.title}</h1>
        <p className="public-description">{deal.description}</p>
        <div className="public-meta">
          <span>
            <b>Seller</b>
            <Link href={`/seller/${deal.sellerProfile.slug}`}>
              {deal.sellerProfile.user.name ?? deal.sellerProfile.slug} ↗
            </Link>
          </span>
          <span>
            <b>Delivery</b>
            {deal.deliveryDeadline
              ? new Date(deal.deliveryDeadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "To be agreed"}
          </span>
        </div>
        <div className="card-divider" />
        <div className="money-row">
          <span>Total protected amount</span>
          <strong>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: deal.currency.toUpperCase(),
            }).format(deal.priceCents / 100)}
          </strong>
        </div>
        <div className="protection-note">
          <span className="secure-lock">⌁</span>
          <span>
            {deal.status === "RELEASED"
              ? "Funds were released after delivery was confirmed."
              : "Funds are held securely and only released after delivery is confirmed."}
          </span>
        </div>
        <div className="payee-disclosure">
          <p className="card-label">WHO YOU&apos;RE PAYING</p>
          <p className="payee-name">
            <strong>{sellerLegalName}</strong>{" "}
            {sellerVerified ? (
              <span className="verify-chip">Verified seller</span>
            ) : (
              <span className="verify-chip verify-pending">
                Identity not fully verified
              </span>
            )}
          </p>
          {sellerKyc?.payoutAccountLast4 && (
            <small>
              Payout account: {sellerKyc.payoutBankName} ending{" "}
              {sellerKyc.payoutAccountLast4}
              {sellerKyc.payoutVerifiedAt ? " · verified" : " · pending"}
            </small>
          )}
          <small>
            TrustBridge is a technology platform, not a bank or licensed escrow.
            Funds are processed and held by {legalEntity.paymentPartner}.
          </small>
          {deal.status !== "AWAITING_PAYMENT" && (
            <Link
              className="verification-report-link"
              href={`/deal/${deal.publicToken}/receipt`}
            >
              View receipt ↗
            </Link>
          )}
        </div>
        {deal.milestones.length === 0 && (deal.depositCents > 0 || deal.balanceCents > 0) && (
          <div className="payment-schedule">
            <div>
              <span>Deposit · released on delivery</span>
              <strong>{money(deal.depositCents)}</strong>
              <small>
                {deal.depositReleasedAt
                  ? "Released to seller"
                  : "Held in escrow"}
              </small>
            </div>
            <div>
              <span>Balance · released on acceptance</span>
              <strong>{money(deal.balanceCents)}</strong>
              <small>
                {deal.balanceReleasedAt
                  ? "Released to seller"
                  : "Held in escrow"}
              </small>
            </div>
          </div>
        )}
        <p className="fee-note">
          Platform fee {money(platformFee)} (
          {process.env.PLATFORM_FEE_PERCENT ?? "5"}%) is deducted from the
          seller payout. Seller receives {money(sellerNet)}.
        </p>
        {deal.status === "DELIVERED" && deal.autoReleaseAt && (
          <div className="review-window">
            <span>BUYER REVIEW WINDOW</span>
            <strong>
              {reviewDays !== null && reviewDays > 0
                ? `${reviewDays} day${reviewDays === 1 ? "" : "s"} left`
                : "Auto-release eligible"}
            </strong>
            <small>
              Auto-release{" "}
              {new Date(deal.autoReleaseAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · confirm or dispute before then.
            </small>
          </div>
        )}
        <ShareDeal url={shareUrl} title={deal.title} />
        {deal.verificationCheck && verificationReport && (
          <div
            className={`deal-verification outcome-${deal.verificationCheck.outcome.toLowerCase().replaceAll("_", "-")}`}
          >
            <div className="verification-head">
              <span className="verdict-pill">
                {deal.verificationCheck.outcome.replaceAll("_", " ")}
              </span>
              <span className="small-muted">
                Checked{" "}
                {new Date(deal.verificationCheck.createdAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                )}
              </span>
            </div>
            <p className="workflow-title">{verificationReport.headline}</p>
            <p className="muted">{verificationReport.summary}</p>
            <p className="small-muted">
              Checked against {deal.verificationCheck.organization}.{" "}
              {verificationReport.couldNotDetermine.length} open question
              {verificationReport.couldNotDetermine.length === 1 ? "" : "s"}{" "}
              remain.
            </p>
            <Link
              className="verification-report-link"
              href={`/verification/${deal.verificationCheck.id}`}
            >
              Open full report ↗
            </Link>
          </div>
        )}
        {deal.status === "AWAITING_PAYMENT" && (
          <PayButton
            token={deal.publicToken}
            disabled={false}
            demoMode={process.env.DEMO_MODE === "true"}
            sellerName={sellerLegalName}
            termsVersion={legalEntity.termsVersion}
          />
        )}
        {deal.evidence.length > 0 && (
          <div className="evidence-list">
            <p className="workflow-title">Delivery evidence</p>
            {deal.evidence.map((item) => (
              <a href={`/api/evidence/${item.id}/download`} key={item.id}>
                {item.fileName} ↗
                <small>
                  {item.aiVerdict
                    ? `Auto triage: ${item.aiVerdict} (${item.aiConfidence}%)`
                    : deal.status === "RELEASED"
                      ? "Accepted with delivery"
                      : deal.status === "DISPUTED"
                        ? "In dispute"
                        : "Awaiting review"}
                </small>
                {item.sha256 && (
                  <small>SHA-256 {item.sha256.slice(0, 12)}…</small>
                )}
              </a>
            ))}
          </div>
        )}
        <DealTimeline items={timeline} />
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
          isBuyer={isBuyer}
          isSeller={isSeller}
          verificationOutcome={deal.verificationCheck?.outcome ?? null}
          demoMode={process.env.DEMO_MODE === "true"}
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
          isSeller={isSeller}
          isBuyer={isBuyer}
          demoMode={process.env.DEMO_MODE === "true"}
          hasMilestones={deal.milestones.length > 0}
        />
        {deal.status === "DISPUTED" && openDispute && (
          <div className="dispute-sla">
            <span>DISPUTE #{openDispute.id.slice(-6).toUpperCase()}</span>
            <strong>
              Response due{" "}
              {disputeDue?.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </strong>
            <small>
              Opened{" "}
              {new Date(openDispute.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}{" "}
              · both sides may add a statement.
            </small>
          </div>
        )}
        {deal.status === "DISPUTED" && (
          <DisputeThread
            token={deal.publicToken}
            statements={statementItems}
            canPost={Boolean(isBuyer || isSeller)}
          />
        )}
        {deal.status === "DISPUTED" && openDispute && (isBuyer || isSeller) && (
          <NoticeDraft
            token={deal.publicToken}
            title={deal.title}
            description={deal.description}
            amountCents={deal.priceCents}
            currency={deal.currency}
            sellerName={sellerLegalName}
            buyerName={deal.buyer?.name ?? "Buyer"}
            buyerEmail={deal.buyer?.email ?? ""}
            reason={openDispute.reason}
            responseBy={
              disputeDue?.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }) ?? "the response deadline"
            }
          />
        )}
        {deal.status === "RELEASED" && <RatingForm token={deal.publicToken} />}
      </section>
      <p className="deal-disclaimer">
        Automated triage is advisory only. Review the deliverables carefully
        before confirming delivery.
      </p>
      <LegalFooter />
    </main>
  );
}
