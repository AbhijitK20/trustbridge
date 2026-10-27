import { NextResponse } from "next/server";
import { z } from "zod";
import { createDemoSession } from "@/lib/demo";
import { demoModeEnabled } from "@/lib/demo-mode";

export const runtime = "nodejs";

const loginSchema = z.object({
  role: z.enum(["buyer", "seller", "admin", "reviewer"]),
});

export async function POST(request: Request) {
  if (!demoModeEnabled()) {
    return NextResponse.json({ error: "Workspace access is not enabled." }, { status: 403 });
  }
  try {
    const { role } = loginSchema.parse(await request.json());
    const { token, expires, user } = await createDemoSession(role);
    const secure = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith("https://");
    return NextResponse.json({
      token,
      cookieName: secure ? "__Secure-authjs.session-token" : "authjs.session-token",
      expires: expires.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose a valid workspace role." }, { status: 400 });
    }
    console.error("mobile.login_failed", error);
    return NextResponse.json({ error: "The workspace could not be opened." }, { status: 500 });
  }
}
