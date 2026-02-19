/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `resetPassword` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `resetPassword` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "resetPassword" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "resetPassword_userId_key" ON "resetPassword"("userId");
