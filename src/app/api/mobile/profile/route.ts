import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      sellerProfile: {
        select: {
          slug: true,
          isVerified: true,
          kyc: {
            select: {
              kycStatus: true,
              legalName: true,
              payoutBankName: true,
              payoutAccountLast4: true,
            },
          },
        },
      },
    },
  });
  return NextResponse.json({ user, demoMode: process.env.DEMO_MODE === "true" });
}
