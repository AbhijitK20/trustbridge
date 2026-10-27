import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { clientAddress, mutationGuard } from "@/lib/abuse";
import { legalEntity } from "@/lib/legal";
import { totalMilestoneCents, validateMilestoneDrafts } from "@/lib/milestones";

const milestoneSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1_000).default(""),
  acceptanceCriteria: z.string().trim().min(5).max(1_000),
  amountCents: z.number().int().positive(),
  dueAt: z.string().datetime().optional(),
  verificationRequired: z.boolean().optional().default(false),
});

const createDealSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4_000),
  priceCents: z.number().int().positive().max(10_000_000),
  depositPercent: z.number().int().min(10).max(100).default(30),
  currency: z.string().trim().length(3).toLowerCase().default("usd"),
  deliveryDeadline: z.string().datetime().optional(),
  sellerName: z.string().trim().min(2).max(80),
  verificationId: z.string().trim().max(40).optional(),
  milestones: z.array(milestoneSchema).max(8).optional(),
  consent: z.literal(true),
});

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "deal-create", 10);
  if (!guard.allowed) return NextResponse.json({ error: guard.status === 403 ? "Cross-origin request rejected." : "Too many deal attempts. Try again later." }, { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } });
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: "Sign in to create a deal." }, { status: 401 });
    const body = createDealSchema.parse(await request.json());
    const slug = body.sellerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "seller";
    const milestones = body.milestones?.length ? body.milestones : null;
    const milestoneError = milestones ? validateMilestoneDrafts(body.priceCents, milestones) : null;
    if (milestoneError) return NextResponse.json({ error: milestoneError }, { status: 400 });
    if (milestones && totalMilestoneCents(milestones) !== body.priceCents) {
      return NextResponse.json({ error: "Milestone amounts must add up to the total protected amount." }, { status: 400 });
    }
    const depositCents = milestones ? 0 : Math.round((body.priceCents * body.depositPercent) / 100);
    const balanceCents = milestones ? body.priceCents : body.priceCents - depositCents;

    const verification = body.verificationId
      ? await prisma.verificationCheck.findUnique({ where: { id: body.verificationId }, select: { id: true, outcome: true } })
      : null;
    if (body.verificationId && !verification) {
      return NextResponse.json({ error: "Verification record not found." }, { status: 400 });
    }
    if (verification?.outcome === "CONTRADICTED") {
      return NextResponse.json(
        { error: "This verification contradicted a material claim. Do not create a protected deal." },
        { status: 409 },
      );
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    const seller = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: body.sellerName, email: session.user.email, role: currentUser?.role === "ADMIN" ? "ADMIN" : "SELLER" },
      include: { sellerProfile: true },
    });

    const sellerProfile = seller.sellerProfile ?? await prisma.sellerProfile.create({
      data: { userId: seller.id, slug: `${slug}-${seller.id.slice(-6)}` },
    });

    const ipAddress = clientAddress(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const deal = await prisma.$transaction(async (transaction) => {
      const created = await transaction.deal.create({
        data: {
          title: body.title,
          description: body.description,
          priceCents: body.priceCents,
          depositCents,
          balanceCents,
          currency: body.currency,
          deliveryDeadline: body.deliveryDeadline ? new Date(body.deliveryDeadline) : undefined,
          status: "AWAITING_PAYMENT",
          sellerId: seller.id,
          sellerProfileId: sellerProfile.id,
          verificationCheckId: verification?.id,
        },
        select: { id: true, publicToken: true },
      });

      if (milestones) {
        await transaction.milestone.createMany({
          data: milestones.map((milestone, index) => ({
            dealId: created.id,
            position: index + 1,
            title: milestone.title,
            description: milestone.description || body.description,
            acceptanceCriteria: milestone.acceptanceCriteria,
            amountCents: milestone.amountCents,
            dueAt: milestone.dueAt ? new Date(milestone.dueAt) : undefined,
            verificationRequired: milestone.verificationRequired ?? false,
          })),
        });
      }

      await transaction.consent.createMany({
        data: [
          { userId: seller.id, dealId: created.id, kind: "TERMS", version: legalEntity.termsVersion, ipAddress, userAgent },
          { userId: seller.id, dealId: created.id, kind: "PRIVACY", version: legalEntity.privacyVersion, ipAddress, userAgent },
        ],
      });

      return created;
    });

    return NextResponse.json({ token: deal.publicToken, depositCents, balanceCents, milestoneCount: milestones?.length ?? 0 }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Please check the deal details." }, { status: 400 });
    console.error("deal.create_failed", error);
    return NextResponse.json({ error: "The deal could not be created." }, { status: 500 });
  }
}
