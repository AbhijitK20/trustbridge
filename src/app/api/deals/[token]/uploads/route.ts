import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createUploadUrl, storageConfigured, storageProvider } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { mutationGuard } from "@/lib/abuse";

const requestSchema = z.object({ fileName: z.string().trim().min(1).max(180), contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"]), fileSize: z.number().int().positive().max(15_000_000) });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const guard = await mutationGuard(request, "upload-url", 20);
  if (!guard.allowed) return NextResponse.json({ error: guard.status === 403 ? "Cross-origin request rejected." : "Too many upload attempts. Try again later." }, { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in before uploading evidence." }, { status: 401 });
  if (!storageConfigured) return NextResponse.json({ error: "Private evidence storage is not configured yet." }, { status: 503 });
  try {
    const input = requestSchema.parse(await request.json());
    const deal = await prisma.deal.findUnique({ where: { publicToken: (await params).token }, select: { id: true, sellerId: true, status: true } });
    if (!deal || deal.sellerId !== session.user.id) return NextResponse.json({ error: "Only the seller can upload evidence for this deal." }, { status: 403 });
    if (deal.status !== "HELD") return NextResponse.json({ error: "Evidence can only be uploaded while payment is held." }, { status: 409 });
    const safeName = input.fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").slice(-120);
    const key = `deals/${deal.id}/${crypto.randomUUID()}-${safeName}`;
    return NextResponse.json({ key, uploadUrl: await createUploadUrl(key, input.contentType), provider: storageProvider });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Unsupported file or file is too large." }, { status: 400 });
    console.error("evidence.upload_url_failed", error);
    return NextResponse.json({ error: "Could not prepare the upload." }, { status: 500 });
  }
}
