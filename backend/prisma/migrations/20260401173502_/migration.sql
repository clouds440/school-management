/*
  Warnings:

  - The values [GROUP] on the enum `TargetType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TargetType_new" AS ENUM ('GLOBAL', 'ORG', 'ROLE', 'SECTION');
ALTER TABLE "Announcement" ALTER COLUMN "targetType" TYPE "TargetType_new" USING ("targetType"::text::"TargetType_new");
ALTER TYPE "TargetType" RENAME TO "TargetType_old";
ALTER TYPE "TargetType_new" RENAME TO "TargetType";
DROP TYPE "TargetType_old";
COMMIT;
