-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "agent_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNo" TEXT,
    "bio" TEXT,
    "languages" TEXT[],
    "agencyId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_applications_userId_key" ON "agent_applications"("userId");

-- AddForeignKey
ALTER TABLE "agent_applications" ADD CONSTRAINT "agent_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_applications" ADD CONSTRAINT "agent_applications_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
