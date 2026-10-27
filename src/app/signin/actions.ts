"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { createDemoSession, type DemoRole } from "@/lib/demo";
import { demoModeEnabled } from "@/lib/demo-mode";

function appBaseUrl() {
  return (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function demoSignIn(role: DemoRole, formData?: FormData) {
  if (!demoModeEnabled()) redirect("/signin?error=demo-disabled");
  const { token, expires } = await createDemoSession(role);
  const secure = appBaseUrl().startsWith("https://");
  const store = await cookies();

  store.set(secure ? "__Secure-authjs.session-token" : "authjs.session-token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    expires,
  });

  const requested = formData?.get("next");
  const safeNext = typeof requested === "string" && requested.startsWith("/") ? requested : null;
  const fallback = role === "admin" ? "/admin/disputes" : role === "reviewer" ? "/admin/approvals" : role === "seller" ? "/seller/meera-studio" : "/create";
  redirect(safeNext ?? fallback);
}

export async function demoSignOut() {
  await signOut({ redirectTo: "/signin" });
}
