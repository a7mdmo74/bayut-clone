-- AlterEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RESERVED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ListingStatus')) THEN
    ALTER TYPE "ListingStatus" ADD VALUE 'RESERVED' AFTER 'ACTIVE';
  END IF;
END $$;
