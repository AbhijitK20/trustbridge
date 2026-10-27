import { NextResponse } from "next/server";
import { ensureContract, signatureView, type ContractSnapshot } from "@/lib/contracts";
import { buildContractPdf } from "@/lib/contract-pdf";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const deal = await prisma.deal.findUnique({
    where: { publicToken: token },
    select: { id: true },
  });
  if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });

  try {
    const contract = await ensureContract(deal.id);
    const snapshot = contract.snapshot as unknown as ContractSnapshot;
    const signatures = contract.signatures.map(signatureView);
    const pdf = await buildContractPdf(snapshot, signatures, contract.contentHash);
    const fileName = `${contract.number.toLowerCase()}-contract.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("contract.pdf_failed", error);
    return NextResponse.json({ error: "The contract PDF could not be generated." }, { status: 500 });
  }
}
