import Stripe from "stripe";
import { env } from "@/lib/env";

export function stripeClient() {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export function calculatePlatformFee(amountCents: number, percentage = env.PLATFORM_FEE_PERCENT) {
  return Math.round(amountCents * (percentage / 100));
}

export function calculateBuyerTotal(amountCents: number, percentage = env.PLATFORM_FEE_PERCENT) {
  return amountCents + calculatePlatformFee(amountCents, percentage);
}
