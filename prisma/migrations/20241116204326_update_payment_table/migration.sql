/*
  Warnings:

  - You are about to drop the column `status` on the `payments` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Completed', 'Failed', 'Inactive', 'Refunded');

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "status",
ADD COLUMN     "Payment_status" "PaymentStatus" NOT NULL DEFAULT 'Inactive',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "subscriptionPlan" SET DEFAULT 'Free Trial';
