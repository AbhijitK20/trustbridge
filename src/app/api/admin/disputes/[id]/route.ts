import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApprovalAction } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { sameOrigin } from "@/lib/abuse";
import { prisma } from "@/lib/prisma";
import { createApproval, requiresSecondApproval } from "@/lib/approvals";
import { executeDisputeResolution } from "@/lib/admin-decisions";

const resolutionSchema = z.object({
  resolution: z.enum(["REFUND_TO_BUYER", "RELEASE_TO_SELLER"]),
  note: z.string().trim().min(10).max(2_000),
});

const actionFor: Record<"REFUND_TO_BUYER" | "RELEASE_TO_SELLER", ApprovalAction> = {
  REFUND_TO_BUYER: "DISPUTE_REFUND",
  RELEASE_TO_SELLER: "DISPUTE_RELEASE",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await params;
  try {
    const input = resolutionSchema.parse(await request.json());
    const dispute = await prisma.dispute.findUnique({ where: { id }, include: { deal: true } });
    if (!dispute || dispute.resolvedAt) return NextResponse.json({ error: "Open dispute not found." }, { status: 404 });
    if (dispute.deal.status !== "DISPUTED") return NextResponse.json({ error: "Deal is not in a disputable state." }, { status: 409 });

    if (requiresSecondApproval(dispute.deal.priceCents)) {
      const approval = await createApproval({
        dealId: dispute.dealId,
        disputeId: dispute.id,
        action: actionFor[input.resolution],
        amountCents: dispute.deal.priceCents,
        note: input.note,
        requestedById: admin.id,
      });
      return NextResponse.json(
        {
          status: "PENDING_SECOND_APPROVAL",
          approvalId: approval.id,
          message: "High-value decision is awaiting a second reviewer.",
        },
        { status: 202 },
      );
    }

    const result = await executeDisputeResolution({
      disputeId: dispute.id,
      resolution: input.resolution,
      note: input.note,
      adminId: admin.id,
    });
    return NextResponse.json(result, { status: "error" in result && result.error ? 409 : 200 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Choose a resolution and provide a decision note." }, { status: 400 });
    console.error("admin.dispute_resolution_failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Dispute resolution failed." }, { status: 500 });
  }
}
