-- CreateEnum
CREATE TYPE "PlanInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('TELR', 'TABBY', 'TAMARA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('SUBSCRIPTION', 'LISTING_BOOST', 'LEAD_CREDITS', 'VIEWING_DEPOSIT');

-- CreateEnum
CREATE TYPE "ViewingStatus" AS ENUM ('REQUESTED', 'DEPOSIT_PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED_BY_BUYER', 'CANCELED_BY_AGENT', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'HELD', 'REFUNDED', 'FORFEITED', 'FAILED');

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "leadCredits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "featuredExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "interval" "PlanInterval" NOT NULL,
    "priceAed" DECIMAL(10,2) NOT NULL,
    "maxListings" INTEGER NOT NULL,
    "maxFeatured" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "providerRef" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "amountAed" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewings" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "agentId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "ViewingStatus" NOT NULL DEFAULT 'REQUESTED',
    "depositStatus" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "depositAmount" DECIMAL(10,2) NOT NULL,
    "depositPaymentId" TEXT,
    "cancelReason" TEXT,
    "canceledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_agentId_idx" ON "subscriptions"("agentId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerRef_key" ON "payments"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "viewings_depositPaymentId_key" ON "viewings"("depositPaymentId");

-- CreateIndex
CREATE INDEX "viewings_buyerId_idx" ON "viewings"("buyerId");

-- CreateIndex
CREATE INDEX "viewings_propertyId_idx" ON "viewings"("propertyId");

-- CreateIndex
CREATE INDEX "viewings_status_idx" ON "viewings"("status");

-- CreateIndex
CREATE INDEX "viewings_scheduledAt_idx" ON "viewings"("scheduledAt");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
