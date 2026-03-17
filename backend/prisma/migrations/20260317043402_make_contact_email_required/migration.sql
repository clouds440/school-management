/*
  Warnings:

  - You are about to drop the column `statusMessage` on the `Organization` table. All the data in the column will be lost.
  - Made the column `contactEmail` on table `Organization` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "statusMessage",
ADD COLUMN     "statusHistory" JSONB,
ALTER COLUMN "contactEmail" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "avatarUrl" TEXT;
