/*
  Warnings:

  - You are about to drop the column `mpesaReferenceCRId` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "mpesaReferenceCRId",
ADD COLUMN     "mpesaReferenceId" TEXT;
