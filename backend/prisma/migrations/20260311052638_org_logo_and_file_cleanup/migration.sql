/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `File` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "avatarUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "logoUrl" TEXT;
