import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getLiveVersion } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const version = await getLiveVersion(session.user.id);
  return NextResponse.json(version, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
