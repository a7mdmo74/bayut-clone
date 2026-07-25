-- AlterEnum: remove TABBY and TAMARA from PaymentProvider, keep TELR only
BEGIN;
CREATE TYPE "PaymentProvider_new" AS ENUM ('TELR');
ALTER TABLE "payments" ALTER COLUMN "provider" TYPE "PaymentProvider_new" USING ("provider"::text::"PaymentProvider_new");
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
DROP TYPE "public"."PaymentProvider_old";
COMMIT;
