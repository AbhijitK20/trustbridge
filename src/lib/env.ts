import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  DEMO_MODE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_CONNECT_RETURN_URL: z.string().url().default("http://localhost:3000/onboarding/return"),
  STRIPE_CONNECT_REFRESH_URL: z.string().url().default("http://localhost:3000/onboarding/refresh"),
  PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(50).default(5),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  DEMO_MODE: process.env.DEMO_MODE,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_CONNECT_RETURN_URL: process.env.STRIPE_CONNECT_RETURN_URL,
  STRIPE_CONNECT_REFRESH_URL: process.env.STRIPE_CONNECT_REFRESH_URL,
  PLATFORM_FEE_PERCENT: process.env.PLATFORM_FEE_PERCENT,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
if (process.env.NODE_ENV === "production" && !isBuildPhase) {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) missing.push("AUTH_SECRET");
  if (!process.env.NEXT_PUBLIC_APP_URL) missing.push("NEXT_PUBLIC_APP_URL");
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
  if (!env.DEMO_MODE && !env.STRIPE_SECRET_KEY) {
    console.error("[env] STRIPE_SECRET_KEY is not configured. Checkout and payouts are disabled.");
  }
}
