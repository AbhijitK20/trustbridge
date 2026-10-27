import { prisma } from "@/lib/prisma";

export function calculateTrustScore(completedDeals: number, ratings: number[], refundDisputes: number, openReports: number) {
  const average = ratings.length ? ratings.reduce((sum, score) => sum + score, 0) / ratings.length : 0;
  const completedPoints = Math.min(completedDeals * 2, 30);
  const ratingPoints = average ? (average / 5) * 55 : 0;
  const historyPenalty = Math.min(refundDisputes * 10, 25) + Math.min(openReports * 15, 30);
  return Math.max(0, Math.min(100, Math.round(completedPoints + ratingPoints + (ratings.length ? 15 : 0) - historyPenalty)));
}

export async function recalculateTrustScore(sellerProfileId: string) {
  const [profile, ratings, disputes, reports] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { id: sellerProfileId }, select: { completedDeals: true } }),
    prisma.rating.findMany({ where: { sellerId: sellerProfileId }, select: { score: true } }),
    prisma.dispute.count({ where: { deal: { sellerProfileId }, resolution: { in: ["REFUND_TO_BUYER", "SPLIT_SETTLEMENT"] } } }),
    prisma.scamReport.count({ where: { sellerId: sellerProfileId, status: { in: ["OPEN", "REVIEWING"] } } }),
  ]);
  if (!profile) throw new Error("Seller profile not found");
  const scores = ratings.map((rating) => rating.score);
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  const score = calculateTrustScore(profile.completedDeals, scores, disputes, reports);
  await prisma.sellerProfile.update({ where: { id: sellerProfileId }, data: { averageRating: average, trustScore: score } });
  return { average, score };
}
