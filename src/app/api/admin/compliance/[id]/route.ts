import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { sameOrigin } from "@/lib/abuse";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(2_000).optional().default(""),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await params;
  try {
    const input = schema.parse(await request.json());
    if (input.action === "REJECT" && input.note.length < 10) {
      return NextResponse.json({ error: "Add a rejection note of at least 10 characters." }, { status: 400 });
    }

    const seller = await prisma.sellerProfile.findUnique({ where: { id }, include: { kyc: true } });
    if (!seller || !seller.kyc) return NextResponse.json({ error: "Seller KYC record not found." }, { status: 404 });

    const approved = input.action === "APPROVE";
    if (approved && seller.kyc.sanctionsStatus === "HIT") {
      return NextResponse.json({ error: "Sanctions hit: escalate for manual review; KYC cannot be approved." }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.sellerKyc.update({
        where: { sellerProfileId: id },
        data: {
          kycStatus: approved ? "VERIFIED" : "REJECTED",
          verifiedAt: approved ? new Date() : null,
          payoutVerifiedAt: approved ? new Date() : null,
          sanctionsStatus: seller.kyc.sanctionsStatus === "HIT" ? "HIT" : "CLEAR",
        },
      }),
      prisma.sellerProfile.update({ where: { id }, data: { isVerified: approved } }),
      prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: approved ? "KYC_APPROVED" : "KYC_REJECTED",
          metadata: { sellerProfileId: id, note: input.note, simulated: process.env.DEMO_MODE === "true" },
        },
      }),
    ]);

    return NextResponse.json({
      status: approved ? "VERIFIED" : "REJECTED",
      message: approved ? "Seller KYC approved." : "Seller KYC rejected and badge removed.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Choose a valid compliance action." }, { status: 400 });
    console.error("admin.compliance_failed", error);
    return NextResponse.json({ error: "The compliance action failed." }, { status: 500 });
  }
}
