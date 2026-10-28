import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateBuyerTotal, calculatePlatformFee } from "@/lib/stripe";
import { legalEntity } from "@/lib/legal";
import type { CheckResult } from "@/lib/verification";

export const contractInclude = {
  buyer: { select: { name: true, email: true } },
  seller: { select: { name: true, email: true } },
  sellerProfile: {
    select: {
      slug: true,
      user: { select: { name: true } },
      kyc: {
        select: {
          legalName: true,
          kycStatus: true,
          payoutAccountName: true,
          payoutAccountLast4: true,
          payoutBankName: true,
          payoutVerifiedAt: true,
        },
      },
    },
  },
  milestones: { orderBy: { position: "asc" as const } },
  evidence: { orderBy: { createdAt: "asc" as const } },
  verificationCheck: {
    select: {
      id: true,
      outcome: true,
      organization: true,
      createdAt: true,
      result: true,
    },
  },
} satisfies Prisma.DealInclude;

export type ContractDeal = Prisma.DealGetPayload<{ include: typeof contractInclude }>;

export type ContractSignatureView = {
  id: string;
  role: "BUYER" | "SELLER";
  name: string;
  signatureText: string;
  signedAt: string;
  method: string;
};

export type ContractSnapshot = {
  number: string;
  generatedAt: string;
  deal: {
    token: string;
    title: string;
    description: string;
    amountCents: number;
    currency: string;
    deliveryDeadline: string | null;
    status: string;
    createdAt: string;
  };
  parties: {
    seller: {
      name: string;
      legalName: string;
      kycStatus: string;
      payoutBank: string | null;
      payoutLast4: string | null;
    };
    buyer: { name: string } | null;
  };
  milestones: Array<{
    position: number;
    title: string;
    description: string;
    acceptanceCriteria: string | null;
    amountCents: number;
    dueAt: string | null;
    status: string;
    verificationRequired: boolean;
  }>;
  verification: {
    outcome: string;
    organization: string;
    headline: string;
    summary: string;
    couldNotDetermine: string[];
  } | null;
  evidence: Array<{
    fileName: string;
    sha256: string | null;
    note: string | null;
    createdAt: string;
  }>;
  fees: {
    platformFeeCents: number;
    buyerTotalCents: number;
    sellerNetCents: number;
    platformFeePercent: number;
  };
  terms: {
    platform: string;
    paymentPartner: string;
    jurisdiction: string;
    disputeWindowDays: number;
    termsVersion: string;
  };
};

export function contractNumber(token: string) {
  return `TB-${token.slice(-8).toUpperCase()}`;
}

export function buildContractSnapshot(deal: ContractDeal): ContractSnapshot {
  const verification = deal.verificationCheck
    ? (deal.verificationCheck.result as unknown as CheckResult)
    : null;
  const fee = calculatePlatformFee(deal.priceCents);
  const sellerLegalName =
    deal.sellerProfile.kyc?.legalName ??
    deal.seller.name ??
    deal.sellerProfile.user.name ??
    deal.sellerProfile.slug;

  return {
    number: contractNumber(deal.publicToken),
    generatedAt: new Date().toISOString(),
    deal: {
      token: deal.publicToken,
      title: deal.title,
      description: deal.description,
      amountCents: deal.priceCents,
      currency: deal.currency,
      deliveryDeadline: deal.deliveryDeadline?.toISOString() ?? null,
      status: deal.status,
      createdAt: deal.createdAt.toISOString(),
    },
    parties: {
      seller: {
        name: deal.seller.name ?? deal.sellerProfile.slug,
        legalName: sellerLegalName,
        kycStatus: deal.sellerProfile.kyc?.kycStatus ?? "NOT_STARTED",
        payoutBank: deal.sellerProfile.kyc?.payoutBankName ?? null,
        payoutLast4: deal.sellerProfile.kyc?.payoutAccountLast4 ?? null,
      },
      buyer: deal.buyer?.name ? { name: deal.buyer.name } : null,
    },
    milestones: deal.milestones.map((milestone) => ({
      position: milestone.position,
      title: milestone.title,
      description: milestone.description,
      acceptanceCriteria: milestone.acceptanceCriteria,
      amountCents: milestone.amountCents,
      dueAt: milestone.dueAt?.toISOString() ?? null,
      status: milestone.status,
      verificationRequired: milestone.verificationRequired,
    })),
    verification: verification
      ? {
          outcome: verification.outcome,
          organization: deal.verificationCheck?.organization ?? "the organisation",
          headline: verification.headline,
          summary: verification.summary,
          couldNotDetermine: verification.couldNotDetermine ?? [],
        }
      : null,
    evidence: deal.evidence.map((item) => ({
      fileName: item.fileName,
      sha256: item.sha256,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
    })),
    fees: {
      platformFeeCents: fee,
      buyerTotalCents: calculateBuyerTotal(deal.priceCents),
      sellerNetCents: deal.priceCents,
      platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT ?? 3),
    },
    terms: {
      platform: "TrustBridge",
      paymentPartner: legalEntity.paymentPartner,
      jurisdiction: legalEntity.jurisdiction,
      disputeWindowDays: 7,
      termsVersion: legalEntity.termsVersion,
    },
  };
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function snapshotHash(snapshot: ContractSnapshot) {
  const committed = { ...snapshot };
  delete (committed as { generatedAt?: string }).generatedAt;
  return createHash("sha256").update(stableStringify(committed)).digest("hex");
}

export async function ensureContract(dealId: string) {
  const existing = await prisma.contract.findUnique({
    where: { dealId },
    include: { signatures: { orderBy: { signedAt: "asc" } } },
  });
  if (existing) return existing;

  const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: contractInclude });
  if (!deal) throw new Error("Deal not found.");

  const snapshot = buildContractSnapshot(deal);
  try {
    return await prisma.contract.create({
      data: {
        dealId,
        number: snapshot.number,
        contentHash: snapshotHash(snapshot),
        snapshot: JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue,
      },
      include: { signatures: { orderBy: { signedAt: "asc" } } },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      const concurrent = await prisma.contract.findUnique({
        where: { dealId },
        include: { signatures: { orderBy: { signedAt: "asc" } } },
      });
      if (concurrent) return concurrent;
    }
    throw error;
  }
}

export async function signContract(input: {
  token: string;
  userId: string;
  email: string;
  name: string;
  signatureText: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const deal = await prisma.deal.findUnique({
    where: { publicToken: input.token },
    select: { id: true, buyerId: true, sellerId: true },
  });
  if (!deal) throw new Error("Deal not found.");
  const role =
    deal.sellerId === input.userId
      ? ("SELLER" as const)
      : deal.buyerId === input.userId
        ? ("BUYER" as const)
        : null;
  if (!role) throw new Error("Only the buyer or seller can sign this contract.");

  const contract = await ensureContract(deal.id);
  if (contract.signatures.some((signature) => signature.role === role)) {
    throw new Error("You have already signed this contract.");
  }

  const result = await prisma.$transaction(async (transaction) => {
    const signature = await transaction.contractSignature.create({
      data: {
        contractId: contract.id,
        signerId: input.userId,
        role,
        name: input.name,
        email: input.email,
        signatureText: input.signatureText,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
    const count = await transaction.contractSignature.count({ where: { contractId: contract.id } });
    const signed = count >= 2;
    await transaction.contract.update({
      where: { id: contract.id },
      data: { status: signed ? "SIGNED" : "PARTIALLY_SIGNED", signedAt: signed ? new Date() : null },
    });
    await transaction.auditLog.create({
      data: {
        dealId: deal.id,
        actorId: input.userId,
        action: "CONTRACT_SIGNED",
        metadata: { role, name: input.name, signatureId: signature.id },
      },
    });
    return { signature, signed };
  });

  return { ...result, role, contractId: contract.id };
}

export function signatureView(signature: {
  id: string;
  role: string;
  name: string;
  signatureText: string;
  method: string;
  signedAt: Date;
}): ContractSignatureView {
  return {
    id: signature.id,
    role: signature.role as "BUYER" | "SELLER",
    name: signature.name,
    signatureText: signature.signatureText,
    method: signature.method,
    signedAt: signature.signedAt.toISOString(),
  };
}
