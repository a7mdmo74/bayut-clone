-- AlterEnum: replace TELR with STRIPE on PaymentProvider
BEGIN;
CREATE TYPE "PaymentProvider_new" AS ENUM ('STRIPE');
ALTER TABLE "payments" ALTER COLUMN "provider" DROP DEFAULT;
ALTER TABLE "payments"
  ALTER COLUMN "provider" TYPE "PaymentProvider_new"
  USING ('STRIPE'::"PaymentProvider_new");
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
DROP TYPE "public"."PaymentProvider_old";
COMMIT;
