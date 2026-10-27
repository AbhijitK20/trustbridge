import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApprovalAction } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { sameOrigin } from "@/lib/abuse";
import { prisma } from "@/lib/prisma";
import { createApproval, requiresSecondApproval } from "@/lib/approvals";
import { executeDeliveryDecision } from "@/lib/admin-decisions";

const deliveryActionSchema = z.object({
  action: z.enum(["ACCEPT", "REFUND", "DISPUTE"]),
  note: z.string().trim().max(2_000).optional().default(""),
});

const actionFor: Record<"ACCEPT" | "REFUND", ApprovalAction> = {
  ACCEPT: "DELIVERY_ACCEPT",
  REFUND: "DELIVERY_REFUND",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await params;
  try {
    const input = deliveryActionSchema.parse(await request.json());
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal || deal.status !== "DELIVERED") {
      return NextResponse.json({ error: "This delivery is not awaiting review." }, { status: 409 });
    }

    if (input.action === "DISPUTE") {
      if (input.note.length < 10) return NextResponse.json({ error: "Add a decision note of at least 10 characters." }, { status: 400 });
      await prisma.$transaction([
        prisma.deal.update({ where: { id }, data: { status: "DISPUTED" } }),
        prisma.dispute.create({ data: { dealId: id, reporterId: deal.buyerId ?? admin.id, reason: input.note } }),
        prisma.auditLog.create({ data: { dealId: id, actorId: admin.id, action: "DELIVERY_ESCALATED", metadata: { note: input.note } } }),
      ]);
      return NextResponse.json({ status: "DISPUTED", message: "Delivery escalated to the dispute queue." });
    }

    if (input.action === "REFUND" && input.note.length < 10) {
      return NextResponse.json({ error: "Add a refund note of at least 10 characters." }, { status: 400 });
    }

    const amountCents = input.action === "ACCEPT" ? deal.balanceCents || deal.priceCents : deal.priceCents;

    if (requiresSecondApproval(amountCents)) {
      const approval = await createApproval({
        dealId: deal.id,
        action: actionFor[input.action],
        amountCents,
        note: input.note || "Delivery reviewed; recommend release of the balance.",
        requestedById: admin.id,
      });
      return NextResponse.json(
        {
          status: "PENDING_SECOND_APPROVAL",
          approvalId: approval.id,
          message: "High-value delivery decision is awaiting a second reviewer.",
        },
        { status: 202 },
      );
    }

    const result = await executeDeliveryDecision({
      dealId: deal.id,
      decision: input.action,
      note: input.note,
      adminId: admin.id,
    });

    const message =
      result.status === "RELEASED"
        ? "Delivery accepted. Funds released."
        : result.status === "REFUNDED"
          ? "Delivery refunded to the buyer."
          : result.error ?? "Decision recorded.";

    return NextResponse.json({ ...result, message }, { status: result.error ? 409 : 200 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Choose a valid delivery action." }, { status: 400 });
    console.error("admin.delivery_action_failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The delivery action could not be completed." }, { status: 500 });
  }
}
