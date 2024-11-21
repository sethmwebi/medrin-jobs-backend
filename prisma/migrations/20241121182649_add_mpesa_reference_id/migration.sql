/*
  Warnings:

  - You are about to drop the column `MpesaReferenceCRId` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "MpesaReferenceCRId",
ADD COLUMN     "mpesaReferenceCRId" TEXT;
