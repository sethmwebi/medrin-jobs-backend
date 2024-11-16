-- AlterTable
ALTER TABLE "users" ADD COLUMN     "jobPostQuota" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionPlan" TEXT NOT NULL DEFAULT 'Basic',
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3);
