import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mutationGuard } from "@/lib/abuse";

const schema = z.object({
  email: z.string().trim().email(),
  domain: z.string().trim().min(3).max(255),
});

function normalizeDomain(value: string) {
  return value.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/\.+$/, "");
}

async function sendEmail(to: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "TrustBridge <onboarding@resend.dev>",
      to,
      subject: "Your TrustBridge verification code",
      html: `<p>Your TrustBridge verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    }),
  });
  return response.ok;
}

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "seller-otp", 6);
  if (!guard.allowed) {
    return NextResponse.json(
      { error: guard.status === 403 ? "Cross-origin request rejected." : "Too many OTP requests. Try again later." },
      { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid work email and domain." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const domain = normalizeDomain(parsed.data.domain);
  const emailDomain = email.slice(email.lastIndexOf("@") + 1);
  if (emailDomain !== domain && !emailDomain.endsWith(`.${domain}`)) {
    return NextResponse.json({ error: `The email must be on ${domain}.` }, { status: 400 });
  }

  const demoMode = process.env.DEMO_MODE === "true";
  const code = demoMode ? "123456" : String(randomInt(100000, 999999));
  const token = `${email}:${code}`;
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: email, token } },
      update: { expires },
      create: { identifier: email, token, expires },
    });

    if (!demoMode) {
      const sent = await sendEmail(email, code);
      if (!sent) return NextResponse.json({ error: "Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM." }, { status: 503 });
    }

    return NextResponse.json({ sent: true, expiresAt: expires, demoOtp: demoMode ? code : undefined });
  } catch (error) {
    console.error("seller.otp_failed", error);
    return NextResponse.json({ error: "The verification code could not be created." }, { status: 500 });
  }
}
