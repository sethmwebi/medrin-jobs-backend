/*
  Warnings:

  - You are about to drop the column `Payment_status` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "Payment_status",
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'requires_payment_method';
