/*
  Warnings:

  - You are about to drop the column `dueDate` on the `Assessment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "dueDate",
ADD COLUMN     "allowSubmissions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "externalLink" TEXT,
ADD COLUMN     "isVideoLink" BOOLEAN NOT NULL DEFAULT false;
