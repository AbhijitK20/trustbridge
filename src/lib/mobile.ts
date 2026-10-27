import type { Prisma } from "@prisma/client";

export const mobileDealInclude = {
  sellerProfile: {
    select: {
      slug: true,
      isVerified: true,
      user: { select: { name: true } },
      kyc: {
        select: {
          kycStatus: true,
          legalName: true,
          payoutBankName: true,
          payoutAccountLast4: true,
        },
      },
    },
  },
  milestones: { orderBy: { position: "asc" as const } },
  contract: {
    select: { number: true, status: true, contentHash: true, signedAt: true },
  },
  verificationCheck: { select: { outcome: true, organization: true } },
} satisfies Prisma.DealInclude;

export type MobileDeal = Prisma.DealGetPayload<{ include: typeof mobileDealInclude }>;

export function serializeMobileDeal(deal: MobileDeal) {
  return {
    token: deal.publicToken,
    title: deal.title,
    description: deal.description,
    status: deal.status,
    priceCents: deal.priceCents,
    currency: deal.currency,
    deliveryDeadline: deal.deliveryDeadline?.toISOString() ?? null,
    autoReleaseAt: deal.autoReleaseAt?.toISOString() ?? null,
    createdAt: deal.createdAt.toISOString(),
    seller: {
      name: deal.sellerProfile.kyc?.legalName ?? deal.sellerProfile.user.name ?? deal.sellerProfile.slug,
      verified: deal.sellerProfile.isVerified,
      kycStatus: deal.sellerProfile.kyc?.kycStatus ?? "NOT_STARTED",
      payoutBank: deal.sellerProfile.kyc?.payoutBankName ?? null,
      payoutLast4: deal.sellerProfile.kyc?.payoutAccountLast4 ?? null,
    },
    milestones: deal.milestones.map((milestone) => ({
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
    })),
    contract: deal.contract
      ? {
          number: deal.contract.number,
          status: deal.contract.status,
          contentHash: deal.contract.contentHash,
          signedAt: deal.contract.signedAt?.toISOString() ?? null,
        }
      : null,
    verificationOutcome: deal.verificationCheck?.outcome ?? null,
    verificationOrganization: deal.verificationCheck?.organization ?? null,
  };
}

export function mobileStats(deals: MobileDeal[]) {
  const active = deals.filter((deal) => !["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status));
  return {
    activeDeals: active.length,
    protectedCents: active.reduce((sum, deal) => sum + deal.priceCents, 0),
    openDisputes: deals.filter((deal) => deal.status === "DISPUTED").length,
  };
}
