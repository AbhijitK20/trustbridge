import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { mutationGuard } from "@/lib/abuse";
import { releaseDepositDeal } from "@/lib/payouts";
import { evidenceHash } from "@/lib/hash";

const deliverySchema = z.object({
  note: z.string().trim().min(10).max(2_000),
  evidence: z.array(z.object({
    fileName: z.string().trim().min(1).max(180),
    storageKey: z.string().trim().min(10).max(300),
    mimeType: z.string().trim().min(1).max(120),
    fileSize: z.number().int().positive().max(15_000_000),
  })).min(1).max(10),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const guard = await mutationGuard(request, "delivery", 12);
  if (!guard.allowed) {
    return NextResponse.json(
      { error: guard.status === 403 ? "Cross-origin request rejected." : "Too many delivery attempts. Try again later." },
      { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } },
    );
  }

  const { token } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Sign in as the seller to submit delivery." }, { status: 401 });

    const body = await request.json().catch(() => null);
    const deal = await prisma.deal.findUnique({ where: { publicToken: token }, include: { seller: true } });
    if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });
    if (deal.sellerId !== session.user.id) return NextResponse.json({ error: "You are not the seller for this deal." }, { status: 403 });
    if (deal.status !== "HELD") return NextResponse.json({ error: "Delivery can only be submitted after payment is held." }, { status: 409 });

    if (process.env.DEMO_MODE === "true") {
      const note = typeof body?.note === "string" ? body.note.trim() : "";
      if (note.length < 10) return NextResponse.json({ error: "Add a delivery note of at least 10 characters." }, { status: 400 });

      const demoHash = evidenceHash({ dealId: deal.id, fileName: "demo-delivery.txt", fileSize: note.length, mimeType: "text/plain", note });

      await prisma.$transaction(async (transaction) => {
        await transaction.deal.update({
          where: { id: deal.id },
          data: { status: "DELIVERED", depositReleasedAt: new Date(), autoReleaseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        });
        await transaction.evidence.create({
          data: {
            dealId: deal.id,
            fileName: "demo-delivery.txt",
            fileUrl: "demo://delivery",
            storageKey: null,
            fileSize: note.length,
            mimeType: "text/plain",
            sha256: demoHash,
            note,
            aiProvider: "deterministic",
            aiVerdict: "NEEDS_HUMAN_REVIEW",
            aiConfidence: 50,
            aiReasoning: "A human must compare the delivery against the agreement.",
          },
        });
        await transaction.auditLog.create({
          data: { dealId: deal.id, actorId: deal.sellerId, action: "DELIVERY_SUBMITTED_SIMULATED", metadata: { simulated: true, note, depositReleased: true } },
        });
      });

      return NextResponse.json({ status: "DELIVERED", simulated: true, message: "Demo delivery recorded. The buyer can now review it." });
    }

    const input = deliverySchema.parse(body);

    await prisma.$transaction(async (transaction) => {
      await transaction.deal.update({
        where: { id: deal.id },
        data: { status: "DELIVERED", autoReleaseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      });
      await transaction.evidence.createMany({
        data: input.evidence.map((item) => ({
          dealId: deal.id,
          fileName: item.fileName,
          fileUrl: "",
          storageKey: item.storageKey,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          sha256: evidenceHash({ dealId: deal.id, fileName: item.fileName, fileSize: item.fileSize, mimeType: item.mimeType, note: input.note }),
          note: input.note,
          aiProvider: "deterministic",
          aiVerdict: "NEEDS_HUMAN_REVIEW",
          aiConfidence: 50,
          aiReasoning: "A human must compare the delivery against the agreement.",
        })),
      });
      await transaction.auditLog.create({
        data: { dealId: deal.id, actorId: deal.sellerId, action: "DELIVERY_SUBMITTED", metadata: { evidenceCount: input.evidence.length, storage: "private" } },
      });
    });

    let depositRelease = "released";
    try {
      await releaseDepositDeal(deal.id);
    } catch (error) {
      depositRelease = "pending";
      console.error("delivery.deposit_release_pending", { dealId: deal.id, error });
    }

    return NextResponse.json({ status: "DELIVERED", depositRelease });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Add a note and at least one valid evidence file." }, { status: 400 });
    console.error("delivery.submit_failed", error);
    return NextResponse.json({ error: "Delivery could not be submitted." }, { status: 500 });
  }
}
