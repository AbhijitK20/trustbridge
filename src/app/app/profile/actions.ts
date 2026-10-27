"use server";

import { signOut } from "@/auth";

export async function appSignOut() {
  await signOut({ redirectTo: "/signin" });
}
