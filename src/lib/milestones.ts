export type MilestoneDraft = {
  title: string;
  description: string;
  acceptanceCriteria: string;
  amountCents: number;
  dueAt?: string;
  verificationRequired?: boolean;
};

export function totalMilestoneCents(milestones: Array<{ amountCents: number }>) {
  return milestones.reduce((total, milestone) => total + milestone.amountCents, 0);
}

export function validateMilestoneDrafts(priceCents: number, milestones: MilestoneDraft[]) {
  if (milestones.length === 0) return null;
  if (milestones.length > 8) return "A deal can have at most 8 milestones.";
  if (milestones.some((milestone) => milestone.amountCents <= 0)) {
    return "Every milestone needs a positive amount.";
  }
  if (totalMilestoneCents(milestones) !== priceCents) {
    return "Milestone amounts must add up to the total protected amount.";
  }
  return null;
}

export function milestoneProgress(
  milestones: Array<{ amountCents: number; status: string }>,
) {
  const total = totalMilestoneCents(milestones);
  const released = milestones
    .filter((milestone) => milestone.status === "RELEASED")
    .reduce((sum, milestone) => sum + milestone.amountCents, 0);
  return {
    totalCents: total,
    releasedCents: released,
    remainingCents: Math.max(0, total - released),
    releasedCount: milestones.filter((milestone) => milestone.status === "RELEASED").length,
    count: milestones.length,
    percent: total > 0 ? Math.round((released / total) * 100) : 0,
  };
}
