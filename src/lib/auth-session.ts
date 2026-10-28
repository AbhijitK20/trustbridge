import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function appBaseUrl() {
  return (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function safeNextPath(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export async function createSessionForUser(userId: string) {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.session.create({ data: { sessionToken, userId, expires } });
  return { sessionToken, expires };
}

export async function setSessionCookie(sessionToken: string, expires: Date) {
  const secure = appBaseUrl().startsWith("https://");
  const store = await cookies();
  store.set(secure ? "__Secure-authjs.session-token" : "authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    expires,
  });
}
