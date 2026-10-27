-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CHANGES_REQUESTED', 'RELEASED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('AWAITING_SIGNATURES', 'PARTIALLY_SIGNED', 'SIGNED', 'VOID');

-- CreateEnum
CREATE TYPE "ContractSignerRole" AS ENUM ('BUYER', 'SELLER');

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "acceptanceCriteria" TEXT,
    "amountCents" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "verificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "submissionNote" TEXT,
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "releasedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ContractStatus" NOT NULL DEFAULT 'AWAITING_SIGNATURES',
    "contentHash" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSignature" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "role" "ContractSignerRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "signatureText" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'TYPED',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Milestone_dealId_status_idx" ON "Milestone"("dealId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_dealId_position_key" ON "Milestone"("dealId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_dealId_key" ON "Contract"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_number_key" ON "Contract"("number");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "ContractSignature_contractId_idx" ON "ContractSignature"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractSignature_contractId_role_key" ON "ContractSignature"("contractId", "role");

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSignature" ADD CONSTRAINT "ContractSignature_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSignature" ADD CONSTRAINT "ContractSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
