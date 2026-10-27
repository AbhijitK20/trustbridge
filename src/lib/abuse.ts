import { env } from "@/lib/env";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

if (process.env.NODE_ENV === "production" && !redis) {
  console.warn("[abuse] Distributed rate limiting is disabled. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.");
}

export function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(env.NEXT_PUBLIC_APP_URL).origin;
  } catch {
    return false;
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  return { allowed: current.count <= limit, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
}

async function distributedRateLimit(key: string, limit: number, windowMs: number) {
  if (!redis) return rateLimit(key, limit, windowMs);
  const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`), prefix: "trustbridge" });
  const result = await limiter.limit(key);
  return { allowed: result.success, retryAfter: Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)) };
}

export async function mutationGuard(request: Request, scope: string, limit = 20) {
  if (!sameOrigin(request)) return { allowed: false, status: 403, retryAfter: 0 };
  const result = await distributedRateLimit(`${scope}:${clientAddress(request)}`, limit, 60_000);
  return { allowed: result.allowed, status: result.allowed ? 200 : 429, retryAfter: result.retryAfter };
}
