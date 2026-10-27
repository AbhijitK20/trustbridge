import { DealStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function publicDealUrl(token: string) {
  return `/deal/${token}`;
}

export async function getPublicDeal(token: string) {
  return prisma.deal.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      publicToken: true,
      createdAt: true,
      autoReleaseAt: true,
      title: true,
      description: true,
      priceCents: true,
      depositCents: true,
      balanceCents: true,
      depositReleasedAt: true,
      balanceReleasedAt: true,
      currency: true,
      deliveryDeadline: true,
      status: true,
      sellerProfile: {
        select: {
          slug: true,
          bio: true,
          completedDeals: true,
          averageRating: true,
          trustScore: true,
          user: { select: { name: true, image: true } },
          kyc: {
            select: {
              legalName: true,
              entityType: true,
              kycStatus: true,
              sanctionsStatus: true,
              payoutAccountName: true,
              payoutBankName: true,
              payoutAccountLast4: true,
              payoutVerifiedAt: true,
            },
          },
        },
      },
      evidence: { select: { id: true, fileName: true, fileUrl: true, mimeType: true, sha256: true, note: true, aiProvider: true, aiVerdict: true, aiConfidence: true, aiReasoning: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      buyer: { select: { name: true, email: true } },
      milestones: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          title: true,
          description: true,
          acceptanceCriteria: true,
          amountCents: true,
          dueAt: true,
          status: true,
          verificationRequired: true,
          submissionNote: true,
          reviewNote: true,
          submittedAt: true,
          releasedAt: true,
        },
      },
      contract: {
        select: {
          id: true,
          number: true,
          status: true,
          contentHash: true,
          signedAt: true,
          createdAt: true,
        },
      },
      disputes: { where: { resolvedAt: null }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, reason: true, createdAt: true } },
      verificationCheck: {
        select: {
          id: true,
          outcome: true,
          decision: true,
          organization: true,
          createdAt: true,
          result: true,
        },
      },
    },
  });
}

export function canAcceptPayment(status: DealStatus) {
  return status === DealStatus.AWAITING_PAYMENT;
}
