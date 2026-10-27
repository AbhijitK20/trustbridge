import { prisma } from "@/lib/prisma";
import { runCheck } from "@/lib/verification";
import { evidenceHash } from "@/lib/hash";

export type DemoRole = "buyer" | "seller" | "admin" | "reviewer";

const DEMO_USERS = {
  buyer: { email: "buyer@trustbridge.demo", name: "Aarav Mehta", role: "BUYER" as const },
  seller: { email: "seller@trustbridge.demo", name: "Meera Nair", role: "SELLER" as const },
  admin: { email: "admin@trustbridge.demo", name: "TrustBridge Admin", role: "ADMIN" as const },
  reviewer: { email: "reviewer@trustbridge.demo", name: "Second Reviewer", role: "ADMIN" as const },
};

export async function ensureDemoWorkspace() {
  const buyer = await prisma.user.upsert({
    where: { email: DEMO_USERS.buyer.email },
    update: { name: DEMO_USERS.buyer.name, role: DEMO_USERS.buyer.role },
    create: DEMO_USERS.buyer,
  });
  const seller = await prisma.user.upsert({
    where: { email: DEMO_USERS.seller.email },
    update: { name: DEMO_USERS.seller.name, role: DEMO_USERS.seller.role },
    create: DEMO_USERS.seller,
  });
  const admin = await prisma.user.upsert({
    where: { email: DEMO_USERS.admin.email },
    update: { name: DEMO_USERS.admin.name, role: DEMO_USERS.admin.role },
    create: DEMO_USERS.admin,
  });
  const reviewer = await prisma.user.upsert({
    where: { email: DEMO_USERS.reviewer.email },
    update: { name: DEMO_USERS.reviewer.name, role: DEMO_USERS.reviewer.role },
    create: DEMO_USERS.reviewer,
  });
  const pendingSeller = await prisma.user.upsert({
    where: { email: "rahul@trustbridge.demo" },
    update: { name: "Rahul Builds", role: "SELLER" },
    create: { email: "rahul@trustbridge.demo", name: "Rahul Builds", role: "SELLER" },
  });

  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {
      isVerified: true,
      verificationMethod: "DIGILOCKER",
      verificationDomain: "meera.studio",
      verifiedAt: new Date(),
    },
    create: {
      userId: seller.id,
      slug: "meera-studio",
      isVerified: true,
      verificationMethod: "DIGILOCKER",
      verificationDomain: "meera.studio",
      verifiedAt: new Date(),
      bio: "Brand designer. Six years of identity systems for early-stage teams.",
      completedDeals: 14,
      averageRating: 4.7,
      trustScore: 78,
    },
  });

  await prisma.sellerKyc.upsert({
    where: { sellerProfileId: sellerProfile.id },
    update: {
      legalName: "Meera Nair",
      entityType: "INDIVIDUAL",
      taxIdLast4: "1234",
      kycStatus: "VERIFIED",
      kycProvider: "demo",
      kycReference: "demo-meera",
      sanctionsStatus: "CLEAR",
      payoutAccountName: "Meera Nair",
      payoutAccountLast4: "4321",
      payoutBankName: "HDFC Bank",
      payoutVerifiedAt: new Date(),
      verifiedAt: new Date(),
    },
    create: {
      sellerProfileId: sellerProfile.id,
      legalName: "Meera Nair",
      entityType: "INDIVIDUAL",
      taxIdLast4: "1234",
      kycStatus: "VERIFIED",
      kycProvider: "demo",
      kycReference: "demo-meera",
      sanctionsStatus: "CLEAR",
      payoutAccountName: "Meera Nair",
      payoutAccountLast4: "4321",
      payoutBankName: "HDFC Bank",
      payoutVerifiedAt: new Date(),
      verifiedAt: new Date(),
    },
  });

  const pendingProfile = await prisma.sellerProfile.upsert({
    where: { userId: pendingSeller.id },
    update: { isVerified: false, verificationDomain: "rahulbuilds.dev" },
    create: {
      userId: pendingSeller.id,
      slug: "rahul-builds",
      bio: "Full-stack freelancer. Fast delivery, small team.",
      isVerified: false,
      trustScore: 41,
    },
  });

  await prisma.sellerKyc.upsert({
    where: { sellerProfileId: pendingProfile.id },
    update: {
      legalName: "Rahul Kumar",
      entityType: "INDIVIDUAL",
      taxIdLast4: "7788",
      kycStatus: "PENDING",
      kycProvider: "demo",
      kycReference: "demo-rahul",
      sanctionsStatus: "CLEAR",
      payoutAccountName: "Rahul K",
      payoutAccountLast4: "9876",
      payoutBankName: "ICICI Bank",
      payoutVerifiedAt: null,
      verifiedAt: null,
    },
    create: {
      sellerProfileId: pendingProfile.id,
      legalName: "Rahul Kumar",
      entityType: "INDIVIDUAL",
      taxIdLast4: "7788",
      kycStatus: "PENDING",
      kycProvider: "demo",
      kycReference: "demo-rahul",
      sanctionsStatus: "CLEAR",
      payoutAccountName: "Rahul K",
      payoutAccountLast4: "9876",
      payoutBankName: "ICICI Bank",
      payoutVerifiedAt: null,
      verifiedAt: null,
    },
  });

  let deal = await prisma.deal.upsert({
    where: { publicToken: "demo-disputed-deal" },
    update: { buyerId: buyer.id, sellerId: seller.id, sellerProfileId: sellerProfile.id, depositCents: 36000, balanceCents: 84000 },
    create: {
      publicToken: "demo-disputed-deal",
      title: "Brand identity & launch kit",
      description:
        "Full brand kit: logo, colour system, typography, and six social templates. Delivery due 18 March. Total ₹1,200.",
      priceCents: 120000,
      depositCents: 36000,
      balanceCents: 84000,
      currency: "inr",
      status: "DISPUTED",
      buyerId: buyer.id,
      sellerId: seller.id,
      sellerProfileId: sellerProfile.id,
      deliveryDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  if (deal.status !== "DISPUTED") {
    await prisma.dispute.deleteMany({ where: { dealId: deal.id } });
    deal = await prisma.deal.update({ where: { id: deal.id }, data: { status: "DISPUTED" } });
  }

  if (!deal.verificationCheckId) {
    const input = {
      organization: "Independent seller",
      counterpartyName: "Meera Nair",
      counterpartyEmail: "seller@trustbridge.demo",
      promise: deal.description,
      amount: "1200",
      officialUrl: "",
      evidenceText: "Portfolio link and two work screenshots.",
    };
    const result = runCheck(input);
    const check = await prisma.verificationCheck.create({
      data: {
        outcome: result.outcome,
        decision: result.decision,
        organization: input.organization,
        counterpartyEmail: input.counterpartyEmail,
        promise: input.promise,
        result: JSON.parse(JSON.stringify(result)),
      },
    });
    deal = await prisma.deal.update({ where: { id: deal.id }, data: { verificationCheckId: check.id } });
  }

  const openDispute = await prisma.dispute.findFirst({
    where: { dealId: deal.id, resolvedAt: null },
  });
  if (!openDispute) {
    await prisma.dispute.create({
      data: {
        dealId: deal.id,
        reporterId: buyer.id,
        reason:
          "The seller delivered a logo but not the full brand kit. The files are unusable and the seller has stopped replying.",
      },
    });
  }

  const missingHashes = await prisma.evidence.findMany({
    where: { dealId: deal.id, sha256: null },
    select: { id: true, fileName: true, fileSize: true, mimeType: true, note: true },
  });
  for (const item of missingHashes) {
    await prisma.evidence.update({
      where: { id: item.id },
      data: { sha256: evidenceHash({ dealId: deal.id, fileName: item.fileName, fileSize: item.fileSize, mimeType: item.mimeType, note: item.note }) },
    });
  }

  const statementCount = await prisma.auditLog.count({ where: { dealId: deal.id, action: "DISPUTE_STATEMENT" } });
  if (statementCount === 0) {
    await prisma.auditLog.createMany({
      data: [
        {
          dealId: deal.id,
          actorId: buyer.id,
          action: "DISPUTE_STATEMENT",
          metadata: {
            role: "BUYER",
            statement: "The delivered files only include a logo draft. The promised colour system, typography, and six social templates are missing.",
          },
        },
        {
          dealId: deal.id,
          actorId: seller.id,
          action: "DISPUTE_STATEMENT",
          metadata: {
            role: "SELLER",
            statement: "I delivered the logo draft first because the buyer asked for a revision. The full colour system and templates are in the shared folder; I can walk through them.",
          },
        },
      ],
    });
  }

  const evidenceCount = await prisma.evidence.count({ where: { dealId: deal.id } });
  if (evidenceCount === 0) {
    await prisma.evidence.createMany({
      data: [
        {
          dealId: deal.id,
          fileName: "logo-draft.svg",
          fileUrl: "demo://logo-draft.svg",
          storageKey: null,
          fileSize: 18400,
          mimeType: "image/svg+xml",
          sha256: evidenceHash({ dealId: deal.id, fileName: "logo-draft.svg", fileSize: 18400, mimeType: "image/svg+xml", note: "Seller's delivery: logo draft only. No colour system or templates." }),
          note: "Seller's delivery: logo draft only. No colour system or templates.",
        },
        {
          dealId: deal.id,
          fileName: "brand-guidelines.pdf",
          fileUrl: "demo://brand-guidelines.pdf",
          storageKey: null,
          fileSize: 220000,
          mimeType: "application/pdf",
          sha256: evidenceHash({ dealId: deal.id, fileName: "brand-guidelines.pdf", fileSize: 220000, mimeType: "application/pdf", note: "Buyer's reference: the full kit the deal promised." }),
          note: "Buyer's reference: the full kit the deal promised.",
        },
      ],
    });
  }

  let deliveryDeal = await prisma.deal.upsert({
    where: { publicToken: "demo-delivery-deal" },
    update: {
      buyerId: buyer.id,
      sellerId: seller.id,
      sellerProfileId: sellerProfile.id,
      description: "Five-page marketing site with responsive layout, copy polish, and a launch checklist. Delivery in 10 days. Total ₹25,000.",
      depositCents: 750000,
      balanceCents: 1750000,
      status: "DELIVERED",
      depositReleasedAt: new Date(),
      balanceReleasedAt: null,
      autoReleaseAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    create: {
      publicToken: "demo-delivery-deal",
      title: "Landing page redesign",
      description:
        "Five-page marketing site with responsive layout, copy polish, and a launch checklist. Delivery in 10 days. Total ₹25,000.",
      priceCents: 2500000,
      depositCents: 750000,
      balanceCents: 1750000,
      currency: "inr",
      status: "DELIVERED",
      buyerId: buyer.id,
      sellerId: seller.id,
      sellerProfileId: sellerProfile.id,
      depositReleasedAt: new Date(),
      autoReleaseAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  if (!deliveryDeal.verificationCheckId) {
    const input = {
      organization: "Independent seller",
      counterpartyName: "Meera Nair",
      counterpartyEmail: "seller@trustbridge.demo",
      promise: deliveryDeal.description,
      amount: "25000",
      officialUrl: "",
      evidenceText: "Portfolio link and delivery screenshots.",
    };
    const result = runCheck(input);
    const check = await prisma.verificationCheck.create({
      data: {
        outcome: result.outcome,
        decision: result.decision,
        organization: input.organization,
        counterpartyEmail: input.counterpartyEmail,
        promise: input.promise,
        result: JSON.parse(JSON.stringify(result)),
      },
    });
    deliveryDeal = await prisma.deal.update({ where: { id: deliveryDeal.id }, data: { verificationCheckId: check.id } });
  }

  const deliveryEvidenceCount = await prisma.evidence.count({ where: { dealId: deliveryDeal.id } });
  if (deliveryEvidenceCount === 0) {
    await prisma.evidence.create({
      data: {
        dealId: deliveryDeal.id,
        fileName: "delivery-pages.pdf",
        fileUrl: "demo://delivery-pages.pdf",
        storageKey: null,
        fileSize: 310000,
        mimeType: "application/pdf",
        sha256: evidenceHash({ dealId: deliveryDeal.id, fileName: "delivery-pages.pdf", fileSize: 310000, mimeType: "application/pdf", note: "Five responsive pages, copy polish, and the launch checklist. Source files in the shared folder." }),
        note: "Five responsive pages, copy polish, and the launch checklist. Source files in the shared folder.",
        aiProvider: "deterministic",
        aiVerdict: "NEEDS_HUMAN_REVIEW",
        aiConfidence: 50,
        aiReasoning: "A human must compare the delivery against the agreement.",
      },
    });
  }

  const pendingDeliveryApproval = await prisma.adminApproval.findFirst({
    where: { dealId: deliveryDeal.id, action: "DELIVERY_ACCEPT", status: "PENDING" },
  });
  if (!pendingDeliveryApproval) {
    await prisma.adminApproval.create({
      data: {
        dealId: deliveryDeal.id,
        action: "DELIVERY_ACCEPT",
        amountCents: deliveryDeal.balanceCents || deliveryDeal.priceCents,
        note: "Delivery evidence reviewed; recommend release of the balance.",
        requestedById: admin.id,
      },
    });
  }

  const deliveryMissingHashes = await prisma.evidence.findMany({
    where: { dealId: deliveryDeal.id, sha256: null },
    select: { id: true, fileName: true, fileSize: true, mimeType: true, note: true },
  });
  for (const item of deliveryMissingHashes) {
    await prisma.evidence.update({
      where: { id: item.id },
      data: { sha256: evidenceHash({ dealId: deliveryDeal.id, fileName: item.fileName, fileSize: item.fileSize, mimeType: item.mimeType, note: item.note }) },
    });
  }

  return { buyer, seller, admin, reviewer, deal };
}

export async function createDemoSession(role: DemoRole) {
  const workspace = await ensureDemoWorkspace();
  const user = role === "admin" ? workspace.admin : role === "reviewer" ? workspace.reviewer : role === "seller" ? workspace.seller : workspace.buyer;
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.session.create({ data: { sessionToken: token, userId: user.id, expires } });

  return { token, expires, user };
}
