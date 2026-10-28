import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function validSignature(body: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Razorpay webhook secret is not configured." }, { status: 503 });
  }

  const signature = (await headers()).get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Razorpay signature." }, { status: 400 });
  }

  const body = await request.text();
  if (!validSignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
  }

  let event: { id?: string; event?: string };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid Razorpay payload." }, { status: 400 });
  }

  const eventKey =
    event.id ??
    createHash("sha256").update(`${event.event ?? "unknown"}:${body}`).digest("hex");
  const id = `razorpay:${eventKey}`;

  const existing = await prisma.webhookEvent.findUnique({ where: { id } });
  if (existing) return NextResponse.json({ received: true, duplicate: true });

  await prisma.webhookEvent.create({
    data: { id, type: event.event ?? "unknown" },
  });

  console.info("razorpay.webhook_received", {
    id: eventKey,
    type: event.event ?? "unknown",
  });

  return NextResponse.json({ received: true });
}
