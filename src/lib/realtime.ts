import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/prisma";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

export type LiveVersion = {
  version: string;
  dealCount: number;
  payoutCount: number;
  updatedAt: string;
  redis: boolean;
};

export async function getLiveVersion(userId: string): Promise<LiveVersion> {
  const key = `trustbridge:live:${userId}`;
  if (redis) {
    const cached = await redis.get<LiveVersion>(key);
    if (cached) return { ...cached, redis: true };
  }

  const [deals, payouts, user] = await Promise.all([
    prisma.deal.aggregate({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      _max: { updatedAt: true },
      _count: { _all: true },
    }),
    prisma.payoutRequest.aggregate({
      where: { sellerProfile: { userId } },
      _max: { createdAt: true, reviewedAt: true },
      _count: { _all: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { updatedAt: true } }),
  ]);

  const version = [
    deals._max.updatedAt?.toISOString() ?? "0",
    deals._count._all,
    payouts._max.createdAt?.toISOString() ?? "0",
    payouts._max.reviewedAt?.toISOString() ?? "0",
    payouts._count._all,
    user?.updatedAt.toISOString() ?? "0",
  ].join(":");

  const payload: LiveVersion = {
    version,
    dealCount: deals._count._all,
    payoutCount: payouts._count._all,
    updatedAt: new Date().toISOString(),
    redis: Boolean(redis),
  };

  if (redis) await redis.set(key, payload, { ex: 30 });
  return payload;
}
