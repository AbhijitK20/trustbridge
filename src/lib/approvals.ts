import type { ApprovalAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const APPROVAL_THRESHOLD_CENTS = Number(process.env.ADMIN_APPROVAL_THRESHOLD_CENTS ?? 1_000_000);

export const APPROVAL_LABELS: Record<ApprovalAction, string> = {
  DISPUTE_REFUND: "Refund buyer",
  DISPUTE_RELEASE: "Release to seller",
  DELIVERY_ACCEPT: "Accept delivery and release balance",
  DELIVERY_REFUND: "Refund buyer for delivery",
};

export function requiresSecondApproval(amountCents: number) {
  return amountCents >= APPROVAL_THRESHOLD_CENTS;
}

export async function findPendingApproval(dealId: string, action: ApprovalAction) {
  return prisma.adminApproval.findFirst({
    where: { dealId, action, status: "PENDING" },
    select: { id: true, requestedById: true },
  });
}

export async function createApproval(input: {
  dealId: string;
  disputeId?: string | null;
  action: ApprovalAction;
  amountCents: number;
  note: string;
  requestedById: string;
}) {
  const existing = await findPendingApproval(input.dealId, input.action);
  if (existing) return existing;

  return prisma.adminApproval.create({
    data: {
      dealId: input.dealId,
      disputeId: input.disputeId ?? null,
      action: input.action,
      amountCents: input.amountCents,
      note: input.note,
      requestedById: input.requestedById,
    },
    select: { id: true, requestedById: true },
  });
}
