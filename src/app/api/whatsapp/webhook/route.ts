import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { clientAddress, rateLimit } from "@/lib/abuse";
import { handleWhatsAppText, sendWhatsAppReply } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected) return NextResponse.json({ error: "WhatsApp webhook is not configured." }, { status: 503 });
  if (mode === "subscribe" && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  const guard = rateLimit(`whatsapp-webhook:${clientAddress(request)}`, 120, 60_000);
  if (!guard.allowed) return NextResponse.json({ error: "Too many webhook calls." }, { status: 429 });

  const raw = await request.text();
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json({ error: "WHATSAPP_APP_SECRET is required in production." }, { status: 503 });
  }
  if (secret) {
    const signature = request.headers.get("x-hub-signature-256") ?? "";
    const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const entries = Array.isArray((payload as { entry?: unknown[] }).entry) ? (payload as { entry: unknown[] }).entry : [];
  for (const entry of entries) {
    const changes = Array.isArray((entry as { changes?: unknown[] }).changes) ? (entry as { changes: unknown[] }).changes : [];
    for (const change of changes) {
      const value = (change as { value?: { messages?: unknown[] } }).value;
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      for (const message of messages) {
        const item = message as { from?: string; type?: string; text?: { body?: string } };
        if (item.type !== "text" || !item.from || !item.text?.body) continue;
        const result = await handleWhatsAppText(item.from, item.text.body);
        await sendWhatsAppReply(item.from, result.reply);
      }
    }
  }

  return NextResponse.json({ received: true });
}
