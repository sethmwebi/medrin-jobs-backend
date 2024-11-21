/*
  Warnings:

  - A unique constraint covering the columns `[mpesaReferenceId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "users_mpesaReferenceId_key" ON "users"("mpesaReferenceId");
