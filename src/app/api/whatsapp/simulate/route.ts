import { NextResponse } from "next/server";
import { z } from "zod";
import { mutationGuard } from "@/lib/abuse";
import { handleWhatsAppText } from "@/lib/whatsapp";

const schema = z.object({ text: z.string().trim().min(1).max(2_000) });

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "whatsapp-simulate", 30);
  if (!guard.allowed) return NextResponse.json({ error: "Too many messages. Try again in a minute." }, { status: guard.status });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send a message first." }, { status: 400 });

  const result = await handleWhatsAppText("demo-user", parsed.data.text);
  return NextResponse.json(result);
}
