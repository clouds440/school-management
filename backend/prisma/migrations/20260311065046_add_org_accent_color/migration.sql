/*
  Warnings:

  - You are about to drop the column `primaryColor` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryColor` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "primaryColor",
DROP COLUMN "secondaryColor",
ADD COLUMN     "accentColor" JSONB;
