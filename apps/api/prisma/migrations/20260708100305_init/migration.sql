-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'AGENT', 'AGENCY_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'VILLA', 'TOWNHOUSE', 'PENTHOUSE', 'STUDIO', 'OFFICE', 'RETAIL', 'WAREHOUSE', 'LAND', 'BUILDING');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PENDING', 'RENTED', 'SOLD', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RentFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'SPAM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "licenseNo" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT,
    "licenseNo" TEXT,
    "bio" TEXT,
    "languages" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emirates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "emirates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "emirateId" TEXT NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,

    CONSTRAINT "sub_communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "listingType" "ListingType" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "price" DECIMAL(12,2) NOT NULL,
    "rentFrequency" "RentFrequency",
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "areaSqft" DECIMAL(10,2),
    "floor" INTEGER,
    "parkingSpots" INTEGER,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "emirateId" TEXT,
    "communityId" TEXT,
    "subCommunityId" TEXT,
    "addressLine" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "ownerId" TEXT NOT NULL,
    "agentId" TEXT,
    "agencyId" TEXT,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_amenities" (
    "propertyId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "property_amenities_pkey" PRIMARY KEY ("propertyId","amenityId")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "senderId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "alertsOn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_slug_key" ON "agencies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_licenseNo_key" ON "agencies"("licenseNo");

-- CreateIndex
CREATE UNIQUE INDEX "agents_userId_key" ON "agents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agents_licenseNo_key" ON "agents"("licenseNo");

-- CreateIndex
CREATE UNIQUE INDEX "emirates_name_key" ON "emirates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "emirates_slug_key" ON "emirates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "communities_emirateId_slug_key" ON "communities"("emirateId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "sub_communities_communityId_slug_key" ON "sub_communities"("communityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "properties_slug_key" ON "properties"("slug");

-- CreateIndex
CREATE INDEX "properties_listingType_propertyType_status_idx" ON "properties"("listingType", "propertyType", "status");

-- CreateIndex
CREATE INDEX "properties_communityId_idx" ON "properties"("communityId");

-- CreateIndex
CREATE INDEX "properties_price_idx" ON "properties"("price");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_name_key" ON "amenities"("name");

-- CreateIndex
CREATE INDEX "leads_propertyId_status_idx" ON "leads"("propertyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_propertyId_key" ON "favorites"("userId", "propertyId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_emirateId_fkey" FOREIGN KEY ("emirateId") REFERENCES "emirates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_communities" ADD CONSTRAINT "sub_communities_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_subCommunityId_fkey" FOREIGN KEY ("subCommunityId") REFERENCES "sub_communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
