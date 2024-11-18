/*
  Warnings:

  - The values [Pending,Completed,Failed,Inactive,Refunded] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('processing', 'succeeded', 'canceled', 'failed', 'requires_payment_method');
ALTER TABLE "payments" ALTER COLUMN "Payment_status" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "Payment_status" TYPE "PaymentStatus_new" USING ("Payment_status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
ALTER TABLE "payments" ALTER COLUMN "Payment_status" SET DEFAULT 'requires_payment_method';
COMMIT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "Payment_status" SET DEFAULT 'requires_payment_method';
