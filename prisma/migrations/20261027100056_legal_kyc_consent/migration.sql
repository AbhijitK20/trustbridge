-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SanctionsStatus" AS ENUM ('NOT_SCREENED', 'CLEAR', 'REVIEW', 'HIT');

-- CreateEnum
CREATE TYPE "SellerEntityType" AS ENUM ('INDIVIDUAL', 'SOLE_PROPRIETOR', 'PARTNERSHIP', 'LLP', 'COMPANY');

-- CreateEnum
CREATE TYPE "ConsentKind" AS ENUM ('TERMS', 'PRIVACY', 'SELLER_AGREEMENT', 'PAYOUT_AUTHORIZATION', 'ELECTRONIC_RECORDS');

-- CreateTable
CREATE TABLE "SellerKyc" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "legalName" TEXT,
    "entityType" "SellerEntityType",
    "taxIdLast4" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "kycProvider" TEXT,
    "kycReference" TEXT,
    "sanctionsStatus" "SanctionsStatus" NOT NULL DEFAULT 'NOT_SCREENED',
    "payoutAccountName" TEXT,
    "payoutAccountLast4" TEXT,
    "payoutBankName" TEXT,
    "payoutVerifiedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerKyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT,
    "kind" "ConsentKind" NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerKyc_sellerProfileId_key" ON "SellerKyc"("sellerProfileId");

-- CreateIndex
CREATE INDEX "SellerKyc_kycStatus_idx" ON "SellerKyc"("kycStatus");

-- CreateIndex
CREATE INDEX "SellerKyc_sanctionsStatus_idx" ON "SellerKyc"("sanctionsStatus");

-- CreateIndex
CREATE INDEX "Consent_userId_kind_idx" ON "Consent"("userId", "kind");

-- CreateIndex
CREATE INDEX "Consent_dealId_idx" ON "Consent"("dealId");

-- AddForeignKey
ALTER TABLE "SellerKyc" ADD CONSTRAINT "SellerKyc_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
