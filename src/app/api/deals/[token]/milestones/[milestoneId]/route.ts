import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { mutationGuard } from "@/lib/abuse";
import { prisma } from "@/lib/prisma";
import { evidenceHash } from "@/lib/hash";

export const runtime = "nodejs";

const milestoneActionSchema = z.object({
  action: z.enum(["SUBMIT", "ACCEPT", "REQUEST_CHANGES", "DISPUTE"]),
  note: z.string().trim().max(2_000).optional().default(""),
  acknowledgeUnverified: z.boolean().optional().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string; milestoneId: string }> },
) {
  const guard = await mutationGuard(request, "milestone-action", 20);
  if (!guard.allowed) {
    return NextResponse.json(
      {
        error:
          guard.status === 403
            ? "Cross-origin request rejected."
            : "Too many milestone actions. Try again later.",
      },
      { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } },
    );
  }

  const { token, milestoneId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to manage this milestone." }, { status: 401 });
  }

  try {
    const input = milestoneActionSchema.parse(await request.json());
    const deal = await prisma.deal.findUnique({
      where: { publicToken: token },
      include: {
        verificationCheck: { select: { outcome: true } },
      },
    });
    if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });

    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, dealId: deal.id },
    });
    if (!milestone) return NextResponse.json({ error: "Milestone not found." }, { status: 404 });

    const isSeller = deal.sellerId === session.user.id;
    const isBuyer = deal.buyerId === session.user.id;
    if (!isSeller && !isBuyer) {
      return NextResponse.json({ error: "Only the buyer or seller can act on this milestone." }, { status: 403 });
    }

    if (["RELEASED", "DISPUTED"].includes(milestone.status)) {
      return NextResponse.json({ error: "This milestone is already closed." }, { status: 409 });
    }
    if (["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status)) {
      return NextResponse.json({ error: "This deal is closed." }, { status: 409 });
    }

    if (input.action === "SUBMIT") {
      if (deal.status === "DISPUTED") {
        return NextResponse.json({ error: "This deal is in dispute. Milestone releases are paused." }, { status: 409 });
      }
      if (!["HELD", "DELIVERED"].includes(deal.status)) {
        return NextResponse.json({ error: "Payment must be held before a milestone can be submitted." }, { status: 409 });
      }
      if (!isSeller) return NextResponse.json({ error: "Only the seller can submit a milestone." }, { status: 403 });
      if (!["PENDING", "CHANGES_REQUESTED"].includes(milestone.status)) {
        return NextResponse.json({ error: "This milestone is not awaiting submission." }, { status: 409 });
      }
      if (input.note.length < 10) {
        return NextResponse.json({ error: "Add a submission note of at least 10 characters." }, { status: 400 });
      }

      const fileName = `milestone-${milestone.position}-${milestone.title}`
        .toLowerCase()
        .replace(/[^a-z0-9.-]+/g, "-")
        .slice(0, 120) + ".txt";
      const hash = evidenceHash({
        dealId: deal.id,
        fileName,
        fileSize: input.note.length,
        mimeType: "text/plain",
        note: input.note,
      });

      await prisma.$transaction([
        prisma.milestone.update({
          where: { id: milestone.id },
          data: {
            status: "SUBMITTED",
            submissionNote: input.note,
            submittedAt: new Date(),
            reviewNote: null,
          },
        }),
        prisma.evidence.create({
          data: {
            dealId: deal.id,
            fileName,
            fileUrl: "demo://milestone-submission",
            storageKey: null,
            fileSize: input.note.length,
            mimeType: "text/plain",
            sha256: hash,
            note: input.note,
            aiProvider: "deterministic",
            aiVerdict: "NEEDS_HUMAN_REVIEW",
            aiConfidence: 50,
            aiReasoning: "A human must compare the milestone submission against its acceptance criteria.",
          },
        }),
        prisma.auditLog.create({
          data: {
            dealId: deal.id,
            actorId: session.user.id,
            action: "MILESTONE_SUBMITTED",
            metadata: {
              milestoneId: milestone.id,
              position: milestone.position,
              title: milestone.title,
              note: input.note,
            },
          },
        }),
      ]);

      revalidatePath(`/deal/${token}`);
      revalidatePath(`/app/deals/${token}`);
      return NextResponse.json({
        status: "SUBMITTED",
        message: "Milestone submitted. The buyer can now review it.",
      });
    }

    if (input.action === "REQUEST_CHANGES") {
      if (!isBuyer) return NextResponse.json({ error: "Only the buyer can request changes." }, { status: 403 });
      if (milestone.status !== "SUBMITTED") {
        return NextResponse.json({ error: "Only a submitted milestone can be sent back." }, { status: 409 });
      }
      if (input.note.length < 10) {
        return NextResponse.json({ error: "Explain what needs to change." }, { status: 400 });
      }
      await prisma.$transaction([
        prisma.milestone.update({
          where: { id: milestone.id },
          data: { status: "CHANGES_REQUESTED", reviewNote: input.note },
        }),
        prisma.auditLog.create({
          data: {
            dealId: deal.id,
            actorId: session.user.id,
            action: "MILESTONE_CHANGES_REQUESTED",
            metadata: { milestoneId: milestone.id, position: milestone.position, title: milestone.title, note: input.note },
          },
        }),
      ]);
      revalidatePath(`/deal/${token}`);
      revalidatePath(`/app/deals/${token}`);
      return NextResponse.json({ status: "CHANGES_REQUESTED", message: "Change request sent to the seller." });
    }

    if (input.action === "DISPUTE") {
      if (input.note.length < 10) {
        return NextResponse.json({ error: "Explain the dispute first." }, { status: 400 });
      }
      await prisma.$transaction(async (transaction) => {
        await transaction.milestone.update({
          where: { id: milestone.id },
          data: { status: "DISPUTED", reviewNote: input.note },
        });
        await transaction.deal.update({ where: { id: deal.id }, data: { status: "DISPUTED" } });
        await transaction.dispute.create({
          data: { dealId: deal.id, reporterId: session.user.id, reason: input.note },
        });
        await transaction.auditLog.create({
          data: {
            dealId: deal.id,
            actorId: session.user.id,
            action: "DISPUTE_OPENED",
            metadata: { milestoneId: milestone.id, position: milestone.position, note: input.note },
          },
        });
      });
      revalidatePath(`/deal/${token}`);
      revalidatePath(`/app/deals/${token}`);
      return NextResponse.json({ status: "DISPUTED", message: "Milestone dispute opened. Funds remain protected." });
    }

    if (!isBuyer) return NextResponse.json({ error: "Only the buyer can release a milestone." }, { status: 403 });
    if (deal.status === "DISPUTED") {
      return NextResponse.json({ error: "This deal is in dispute. Milestone releases are paused." }, { status: 409 });
    }
    if (!["HELD", "DELIVERED"].includes(deal.status)) {
      return NextResponse.json({ error: "Payment must be held before a milestone can be released." }, { status: 409 });
    }
    if (milestone.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Only a submitted milestone can be accepted." }, { status: 409 });
    }
    if (process.env.DEMO_MODE !== "true") {
      return NextResponse.json(
        { error: "Milestone payouts are not enabled for real money yet. Connect the licensed payment partner first." },
        { status: 409 },
      );
    }

    const outcome = deal.verificationCheck?.outcome ?? "UNDETERMINED";
    if (milestone.verificationRequired && outcome === "CONTRADICTED") {
      return NextResponse.json(
        { error: "Verification contradicted a material claim. This milestone cannot be released." },
        { status: 409 },
      );
    }
    if (milestone.verificationRequired && outcome === "UNDETERMINED" && !input.acknowledgeUnverified) {
      return NextResponse.json(
        {
          error: "Verification is unresolved. Confirm that you want to release this milestone anyway.",
          requiresAcknowledgement: true,
        },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (transaction) => {
      await transaction.milestone.update({
        where: { id: milestone.id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
          releasedById: session.user.id,
          reviewNote: input.note || "Milestone accepted.",
        },
      });
      const remaining = await transaction.milestone.count({
        where: { dealId: deal.id, status: { not: "RELEASED" } },
      });
      await transaction.deal.update({
        where: { id: deal.id },
        data:
          remaining === 0
            ? { status: "RELEASED", balanceReleasedAt: new Date() }
            : { status: "HELD" },
      });
      await transaction.auditLog.create({
        data: {
          dealId: deal.id,
          actorId: session.user.id,
          action: "MILESTONE_RELEASED",
          metadata: {
            milestoneId: milestone.id,
            position: milestone.position,
            title: milestone.title,
            amountCents: milestone.amountCents,
            note: input.note,
            simulated: true,
          },
        },
      });
      return { remaining };
    });

    revalidatePath(`/deal/${token}`);
    revalidatePath(`/app/deals/${token}`);
    return NextResponse.json({
      status: result.remaining === 0 ? "RELEASED" : "MILESTONE_RELEASED",
      message:
        result.remaining === 0
          ? "Final milestone released. The deal is complete."
          : "Milestone released. The next milestone remains protected.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose a valid milestone action." }, { status: 400 });
    }
    console.error("milestone.action_failed", error);
    return NextResponse.json({ error: "The milestone action could not be completed." }, { status: 500 });
  }
}
