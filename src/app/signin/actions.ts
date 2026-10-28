"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { createSessionForUser, safeNextPath, setSessionCookie } from "@/lib/auth-session";
import { createDemoSession, type DemoRole } from "@/lib/demo";
import { demoModeEnabled } from "@/lib/demo-mode";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

function signInError(error: string, next: string | null) {
  const params = new URLSearchParams({ error });
  if (next) params.set("next", next);
  return `/signin?${params.toString()}`;
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function passwordSignIn(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) redirect(signInError("missing-fields", next));

  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: { where: { provider: "credentials", providerAccountId: email }, take: 1 } },
  });
  const passwordHash = user?.accounts[0]?.access_token;
  if (!user || !passwordHash || !(await verifyPassword(password, passwordHash))) {
    redirect(signInError("invalid-credentials", next));
  }

  const { sessionToken, expires } = await createSessionForUser(user.id);
  await setSessionCookie(sessionToken, expires);
  redirect(next ?? "/dashboard");
}

export async function passwordSignUp(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(signInError("invalid-email", next));
  if (password.length < 8) redirect(signInError("weak-password", next));

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect(signInError("account-exists", next));

  const passwordHash = await hashPassword(password);
  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          name: email.split("@")[0],
        },
      });
      await tx.account.create({
        data: {
          userId: created.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
          access_token: passwordHash,
        },
      });
      return created;
    });
  } catch {
    redirect(signInError("account-exists", next));
  }

  const { sessionToken, expires } = await createSessionForUser(user.id);
  await setSessionCookie(sessionToken, expires);
  redirect(next ?? "/dashboard");
}

export async function demoSignIn(role: DemoRole, formData?: FormData) {
  if (!demoModeEnabled()) redirect("/signin?error=demo-disabled");
  const { token, expires } = await createDemoSession(role);
  await setSessionCookie(token, expires);

  const safeNext = safeNextPath(formData?.get("next"));
  const fallback = role === "admin" ? "/admin/disputes" : role === "reviewer" ? "/admin/approvals" : role === "seller" ? "/seller/meera-studio" : "/dashboard";
  redirect(safeNext ?? fallback);
}

export async function demoSignOut() {
  await signOut({ redirectTo: "/signin" });
}
