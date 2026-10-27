import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await prisma.verificationCheck.findUnique({
    where: { id },
    select: { id: true, createdAt: true, outcome: true, organization: true, result: true },
  });

  if (!check) return NextResponse.json({ error: "Verification not found." }, { status: 404 });

  return NextResponse.json(check);
}
