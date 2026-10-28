import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const getDashboardSession = cache(() => auth());

export const getDashboardUser = cache(async () => {
  const session = await getDashboardSession();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      sellerProfile: {
        select: { id: true, isVerified: true, trustScore: true, slug: true },
      },
    },
  });
});
