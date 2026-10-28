import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page() {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TrustBridge signed in</title></head>
<body style="margin:0;background:#14110d;color:#fbf6ec;font-family:system-ui,sans-serif;display:grid;min-height:100vh;place-items:center">
  <main style="max-width:360px;padding:32px;text-align:center">
    <div style="width:44px;height:44px;margin:0 auto 20px;border-radius:50%;background:#233a30;color:#e7d4a8;display:grid;place-items:center;font-size:24px;font-style:italic">T</div>
    <h1 style="font-size:30px;font-weight:500;letter-spacing:-.04em;margin:0 0 10px">Signed in.</h1>
    <p style="color:#c9bfae;font-size:13px;line-height:1.6;margin:0">Return to the TrustBridge app. It will finish opening your workspace automatically.</p>
  </main>
</body>
</html>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const device = searchParams.get("device") ?? "";
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(device)) {
    return new Response("Invalid device code.", { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    const next = `/api/mobile/auth/complete?device=${encodeURIComponent(device)}`;
    return NextResponse.redirect(new URL(`/signin?next=${encodeURIComponent(next)}`, request.url));
  }

  const secure = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith("https://");
  const cookieName = secure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const sessionToken = (await cookies()).get(cookieName)?.value;
  if (!sessionToken) return new Response("Session cookie missing.", { status: 401 });

  const identifier = `mobile:${device}`;
  await prisma.verificationToken.deleteMany({
    where: { OR: [{ identifier }, { token: sessionToken }] },
  });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: sessionToken,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return new Response(page(), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
