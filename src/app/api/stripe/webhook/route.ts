import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  const payload = await request.text();
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("stripe.webhook_invalid_signature", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const alreadyProcessed = await prisma.webhookEvent.findUnique({ where: { id: event.id } });
  if (alreadyProcessed) return NextResponse.json({ received: true, duplicate: true });

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.webhookEvent.create({ data: { id: event.id, type: event.type } });

      if (event.type !== "checkout.session.completed") return;
      const session = event.data.object as Stripe.Checkout.Session;
      const dealId = session.metadata?.dealId;
      if (!dealId || session.payment_status !== "paid") return;

      const deal = await transaction.deal.findUnique({ where: { id: dealId } });
      if (!deal || deal.status !== "AWAITING_PAYMENT") return;

      const buyerEmail = session.customer_details?.email ?? session.customer_email;
      if (!buyerEmail) throw new Error(`No buyer email on checkout session ${session.id}`);

      const buyer = await transaction.user.upsert({
        where: { email: buyerEmail },
        update: {},
        create: { email: buyerEmail, role: "BUYER" },
      });

      await transaction.deal.update({
        where: { id: deal.id },
        data: {
          status: "HELD",
          buyerId: buyer.id,
          stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          auditEvents: { create: { actorId: buyer.id, action: "PAYMENT_HELD", metadata: { checkoutSessionId: session.id, eventId: event.id } } },
        },
      });
    });
  } catch (error) {
    console.error("stripe.webhook_processing_failed", { eventId: event.id, error });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
