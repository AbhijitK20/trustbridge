import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDownloadUrl, storageConfigured } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to view evidence." }, { status: 401 });

  const evidence = await prisma.evidence.findUnique({
    where: { id: (await params).id },
    include: { deal: { select: { buyerId: true, sellerId: true } } },
  });
  if (!evidence?.storageKey) return NextResponse.json({ error: "Evidence not found." }, { status: 404 });

  const isParticipant = session.user.id === evidence.deal.buyerId || session.user.id === evidence.deal.sellerId;
  if (!isParticipant) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "You cannot view this evidence." }, { status: 403 });
    }
  }

  if (!storageConfigured) return NextResponse.json({ error: "Evidence storage is not configured." }, { status: 503 });

  try {
    return NextResponse.redirect(await createDownloadUrl(evidence.storageKey));
  } catch (error) {
    console.error("evidence.download_url_failed", { evidenceId: evidence.id, error });
    return NextResponse.json({ error: "The evidence link could not be created." }, { status: 502 });
  }
}
