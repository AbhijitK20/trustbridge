import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const device = searchParams.get("device") ?? "";
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(device)) {
    return NextResponse.json({ error: "Invalid device code." }, { status: 400 });
  }

  const identifier = `mobile:${device}`;
  const record = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { expires: "desc" },
  });
  if (!record) {
    return NextResponse.json({ pending: true }, { status: 202, headers: { "Cache-Control": "no-store" } });
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return NextResponse.json({ error: "This sign-in expired. Try again." }, { status: 410 });
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken: record.token },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  if (!session || session.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return NextResponse.json({ error: "This sign-in is no longer valid." }, { status: 401 });
  }

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  const secure = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith("https://");
  return NextResponse.json(
    {
      token: record.token,
      cookieName: secure ? "__Secure-authjs.session-token" : "authjs.session-token",
      expires: session.expires.toISOString(),
      user: session.user,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
