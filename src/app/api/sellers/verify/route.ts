import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientAddress, mutationGuard } from "@/lib/abuse";
import { legalEntity } from "@/lib/legal";

const verifySchema = z.object({
  email: z.string().trim().email("Enter a valid work email."),
  domain: z.string().trim().min(3, "Enter your work domain.").max(255),
  legalName: z.string().trim().min(2, "Enter the legal seller name.").max(160),
  entityType: z.enum(["INDIVIDUAL", "SOLE_PROPRIETOR", "PARTNERSHIP", "LLP", "COMPANY"]),
  taxIdLast4: z.string().trim().regex(/^[A-Za-z0-9]{4}$/, "Enter the last four characters of the tax ID."),
  payoutAccountName: z.string().trim().min(2, "Enter the payout account holder name.").max(160),
  payoutBankName: z.string().trim().min(2, "Enter the bank name.").max(120),
  payoutAccountLast4: z.string().trim().regex(/^\d{4}$/, "Enter the last four digits of the payout account."),
  digilocker: z.boolean().optional().default(false),
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the six-digit verification code."),
  consent: z.literal(true),
});

function normalizeDomain(value: string) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .replace(/\.+$/, "");
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "seller-verify", 8);
  if (!guard.allowed) {
    return NextResponse.json(
      { error: guard.status === 403 ? "Cross-origin request rejected." : "Too many verification attempts. Try again later." },
      { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } },
    );
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to verify a seller profile." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the verification details." }, { status: 400 });
  }

  const input = parsed.data;
  const email = input.email.toLowerCase();
  const domain = normalizeDomain(input.domain);
  if (!domain.includes(".")) return NextResponse.json({ error: "Enter a valid domain, e.g. studio.com." }, { status: 400 });

  const emailDomain = email.slice(email.lastIndexOf("@") + 1);
  if (emailDomain !== domain && !emailDomain.endsWith(`.${domain}`)) {
    return NextResponse.json({ error: `The email must be on ${domain}.` }, { status: 400 });
  }

  const verification = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: `${email}:${input.otp}` } },
  });
  if (!verification || verification.expires < new Date()) {
    return NextResponse.json({ error: "The verification code is invalid or expired. Request a new one." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const slugBase = (user.name ?? user.email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "seller";
    const method = input.digilocker ? "DIGILOCKER" : "EMAIL_DOMAIN";
    const namesMatch = normalizeName(input.legalName) === normalizeName(input.payoutAccountName);
    const kycStatus = namesMatch ? "VERIFIED" : "PENDING";

    const profile = await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      update: {
        isVerified: namesMatch,
        verificationMethod: method,
        verificationDomain: domain,
        verifiedAt: namesMatch ? new Date() : null,
      },
      create: {
        userId: user.id,
        slug: `${slugBase}-${user.id.slice(-6)}`,
        isVerified: namesMatch,
        verificationMethod: method,
        verificationDomain: domain,
        verifiedAt: namesMatch ? new Date() : null,
      },
      select: { id: true, slug: true },
    });

    await prisma.sellerKyc.upsert({
      where: { sellerProfileId: profile.id },
      update: {
        legalName: input.legalName,
        entityType: input.entityType,
        taxIdLast4: input.taxIdLast4.toUpperCase(),
        kycStatus,
        kycProvider: legalEntity.kycProvider,
        kycReference: `demo-${profile.id}`,
        sanctionsStatus: "CLEAR",
        payoutAccountName: input.payoutAccountName,
        payoutAccountLast4: input.payoutAccountLast4,
        payoutBankName: input.payoutBankName,
        payoutVerifiedAt: namesMatch ? new Date() : null,
        verifiedAt: namesMatch ? new Date() : null,
      },
      create: {
        sellerProfileId: profile.id,
        legalName: input.legalName,
        entityType: input.entityType,
        taxIdLast4: input.taxIdLast4.toUpperCase(),
        kycStatus,
        kycProvider: legalEntity.kycProvider,
        kycReference: `demo-${profile.id}`,
        sanctionsStatus: "CLEAR",
        payoutAccountName: input.payoutAccountName,
        payoutAccountLast4: input.payoutAccountLast4,
        payoutBankName: input.payoutBankName,
        payoutVerifiedAt: namesMatch ? new Date() : null,
        verifiedAt: namesMatch ? new Date() : null,
      },
    });

    if (user.role !== "ADMIN") {
      await prisma.user.update({ where: { id: user.id }, data: { role: "SELLER" } });
    }

    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: `${email}:${input.otp}` } },
    }).catch(() => undefined);

    const ipAddress = clientAddress(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const consentKinds = ["SELLER_AGREEMENT", "TERMS", "PRIVACY", "PAYOUT_AUTHORIZATION", "ELECTRONIC_RECORDS"] as const;

    for (const kind of consentKinds) {
      const version = kind === "SELLER_AGREEMENT" ? legalEntity.sellerAgreementVersion : kind === "PRIVACY" ? legalEntity.privacyVersion : legalEntity.termsVersion;
      const existing = await prisma.consent.findFirst({ where: { userId: user.id, kind, version } });
      if (!existing) {
        await prisma.consent.create({
          data: { userId: user.id, kind, version, ipAddress, userAgent },
        });
      }
    }

    return NextResponse.json({ slug: profile.slug, kycStatus, namesMatch, method });
  } catch (error) {
    console.error("seller.verify_failed", error);
    return NextResponse.json({ error: "Seller verification could not be saved." }, { status: 500 });
  }
}
