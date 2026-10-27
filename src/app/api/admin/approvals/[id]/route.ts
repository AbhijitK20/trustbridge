import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { sameOrigin } from "@/lib/abuse";
import { prisma } from "@/lib/prisma";
import { executeDisputeResolution, executeDeliveryDecision } from "@/lib/admin-decisions";

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(2_000).optional().default(""),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await params;
  try {
    const input = decisionSchema.parse(await request.json());
    const approval = await prisma.adminApproval.findUnique({ where: { id }, include: { deal: true, dispute: true } });
    if (!approval || approval.status !== "PENDING") {
      return NextResponse.json({ error: "This approval request is no longer open." }, { status: 409 });
    }
    if (approval.requestedById === admin.id) {
      return NextResponse.json({ error: "Maker-checker: a different admin must approve this request." }, { status: 403 });
    }

    if (input.decision === "REJECT") {
      await prisma.$transaction([
        prisma.adminApproval.update({
          where: { id },
          data: { status: "REJECTED", decidedById: admin.id, decidedAt: new Date() },
        }),
        prisma.auditLog.create({
          data: {
            dealId: approval.dealId,
            actorId: admin.id,
            action: "APPROVAL_REJECTED",
            metadata: { approvalId: approval.id, action: approval.action, reviewerNote: input.note },
          },
        }),
      ]);
      return NextResponse.json({ status: "REJECTED", approvalStatus: "REJECTED", message: "Request rejected. No money moved." });
    }

    let result: { status: string; simulated?: boolean; error?: string; refundId?: string; transferId?: string | null };
    if (approval.action === "DISPUTE_REFUND" || approval.action === "DISPUTE_RELEASE") {
      if (!approval.disputeId) return NextResponse.json({ error: "The linked dispute is missing." }, { status: 409 });
      result = await executeDisputeResolution({
        disputeId: approval.disputeId,
        resolution: approval.action === "DISPUTE_REFUND" ? "REFUND_TO_BUYER" : "RELEASE_TO_SELLER",
        note: approval.note,
        adminId: admin.id,
      });
    } else {
      result = await executeDeliveryDecision({
        dealId: approval.dealId,
        decision: approval.action === "DELIVERY_ACCEPT" ? "ACCEPT" : "REFUND",
        note: approval.note,
        adminId: admin.id,
      });
    }

    const pendingPayout = Boolean(result.error);
    await prisma.$transaction([
      prisma.adminApproval.update({
        where: { id },
        data: {
          status: pendingPayout ? "APPROVED" : "EXECUTED",
          decidedById: admin.id,
          decidedAt: new Date(),
          executedAt: pendingPayout ? null : new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          dealId: approval.dealId,
          actorId: admin.id,
          action: pendingPayout ? "APPROVAL_APPROVED_PAYOUT_PENDING" : "APPROVAL_APPROVED",
          metadata: { approvalId: approval.id, action: approval.action, reviewerNote: input.note, result },
        },
      }),
    ]);

    return NextResponse.json(
      {
        status: result.status,
        approvalStatus: pendingPayout ? "APPROVED" : "EXECUTED",
        message: pendingPayout ? result.error : "Second approval recorded and decision executed.",
        result,
      },
      { status: pendingPayout ? 409 : 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
    console.error("admin.approval_failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The approval could not be completed." }, { status: 500 });
  }
}
