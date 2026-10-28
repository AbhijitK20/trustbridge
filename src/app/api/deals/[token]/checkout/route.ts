import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { auth } from "@/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { canAcceptPayment } from "@/lib/deals";
import { clientAddress, mutationGuard } from "@/lib/abuse";
import { legalEntity } from "@/lib/legal";
import { calculateBuyerTotal, calculatePlatformFee } from "@/lib/stripe";

const buyerSchema = z.object({
  buyerEmail: z.string().email(),
  consent: z.literal(true),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const guard = await mutationGuard(request, "checkout", 8);
  if (!guard.allowed) {
    return NextResponse.json(
      { error: guard.status === 403 ? "Cross-origin request rejected." : "Too many checkout attempts. Try again later." },
      { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } },
    );
  }

  const { token } = await params;
  const deal = await prisma.deal.findUnique({ where: { publicToken: token } });
  if (!deal || !canAcceptPayment(deal.status)) {
    return NextResponse.json({ error: "This deal is no longer accepting payment." }, { status: 409 });
  }

  const demoMode = process.env.DEMO_MODE === "true";
  if (!demoMode && !env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable checkout." },
      { status: 503 },
    );
  }

  try {
    const { buyerEmail } = buyerSchema.parse(await request.json());

    const session = await auth();
    const buyer =
      session?.user?.id && session.user.email?.toLowerCase() === buyerEmail.toLowerCase()
        ? await prisma.user.findUnique({ where: { id: session.user.id } })
        : await prisma.user.upsert({
            where: { email: buyerEmail },
            update: {},
            create: { email: buyerEmail, name: buyerEmail.split("@")[0] },
          });
    if (!buyer) return NextResponse.json({ error: "Could not create the buyer record." }, { status: 400 });

    const ipAddress = clientAddress(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;
    for (const kind of ["TERMS", "PRIVACY", "PAYOUT_AUTHORIZATION"] as const) {
      const version = kind === "PRIVACY" ? legalEntity.privacyVersion : legalEntity.termsVersion;
      const existing = await prisma.consent.findFirst({
        where: { userId: buyer.id, dealId: deal.id, kind, version },
      });
      if (!existing) {
        await prisma.consent.create({
          data: { userId: buyer.id, dealId: deal.id, kind, version, ipAddress, userAgent },
        });
      }
    }

    if (demoMode) {
      await prisma.$transaction([
        prisma.deal.update({
          where: { id: deal.id },
          data: { status: "HELD", buyerId: buyer.id, stripePaymentId: `demo_${deal.id}` },
        }),
        prisma.auditLog.create({
          data: { dealId: deal.id, actorId: buyer.id, action: "DEMO_PAYMENT_HELD", metadata: { simulated: true, buyerEmail, consentVersion: legalEntity.termsVersion } },
        }),
      ]);

      return NextResponse.json({ demo: true, status: "HELD", consentVersion: legalEntity.termsVersion, message: "Demo payment held. No real money moved." });
    }

    const stripeKey = env.STRIPE_SECRET_KEY;
    if (!stripeKey) return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
    const stripe = new Stripe(stripeKey);
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: buyerEmail,
      line_items: [
        {
          price_data: {
            currency: deal.currency,
            product_data: { name: deal.title, description: deal.description.slice(0, 500) },
            unit_amount: calculateBuyerTotal(deal.priceCents),
          },
          quantity: 1,
        },
      ],
      metadata: {
        dealId: deal.id,
        publicToken: deal.publicToken,
        consentVersion: legalEntity.termsVersion,
        protectionFeeCents: String(calculatePlatformFee(deal.priceCents)),
        buyerTotalCents: String(calculateBuyerTotal(deal.priceCents)),
      },
      success_url: `${env.NEXT_PUBLIC_APP_URL}/deal/${deal.publicToken}?paid=1`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/deal/${deal.publicToken}?cancelled=1`,
    });
    return NextResponse.json({ url: checkout.url, consentVersion: legalEntity.termsVersion });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid buyer email and accept the terms." }, { status: 400 });
    }
    console.error("checkout.create_failed", error);
    return NextResponse.json({ error: "Checkout could not be started." }, { status: 500 });
  }
}
