import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mutationGuard } from "@/lib/abuse";

const schema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "seller-otp-check", 12);
  if (!guard.allowed) {
    return NextResponse.json(
      { error: guard.status === 403 ? "Cross-origin request rejected." : "Too many attempts. Try again later." },
      { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ verified: false, error: "Enter the six-digit code." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const token = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: `${email}:${parsed.data.otp}` } },
  });

  if (!token || token.expires < new Date()) {
    return NextResponse.json({ verified: false, error: "The code is invalid or expired." }, { status: 400 });
  }

  return NextResponse.json({ verified: true });
}
