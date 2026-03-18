/*
  Warnings:

  - Made the column `registrationNumber` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fee` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `major` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `feePlan` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rollNumber` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `salary` on table `Teacher` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subject` on table `Teacher` required. This step will fail if there are existing NULL values in that column.
  - Made the column `designation` on table `Teacher` required. This step will fail if there are existing NULL values in that column.
  - Made the column `education` on table `Teacher` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing NULLs
UPDATE "Student" SET "registrationNumber" = 'TEMP_ID' WHERE "registrationNumber" IS NULL;
UPDATE "Student" SET "fee" = 0.0 WHERE "fee" IS NULL;
UPDATE "Student" SET "major" = 'Unassigned' WHERE "major" IS NULL;
UPDATE "Student" SET "feePlan" = 'Unassigned' WHERE "feePlan" IS NULL;
UPDATE "Student" SET "gender" = 'Unassigned' WHERE "gender" IS NULL;
UPDATE "Student" SET "rollNumber" = 'TEMP_ROLL' WHERE "rollNumber" IS NULL;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "registrationNumber" SET NOT NULL,
ALTER COLUMN "registrationNumber" SET DEFAULT 'TEMP_ID',
ALTER COLUMN "fee" SET NOT NULL,
ALTER COLUMN "fee" SET DEFAULT 0.0,
ALTER COLUMN "major" SET NOT NULL,
ALTER COLUMN "major" SET DEFAULT 'Unassigned',
ALTER COLUMN "feePlan" SET NOT NULL,
ALTER COLUMN "feePlan" SET DEFAULT 'Unassigned',
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "gender" SET DEFAULT 'Unassigned',
ALTER COLUMN "rollNumber" SET NOT NULL,
ALTER COLUMN "rollNumber" SET DEFAULT 'TEMP_ROLL';

-- Update existing NULLs for Teacher
UPDATE "Teacher" SET "salary" = 0.0 WHERE "salary" IS NULL;
UPDATE "Teacher" SET "subject" = 'Unassigned' WHERE "subject" IS NULL;
UPDATE "Teacher" SET "designation" = 'Unassigned' WHERE "designation" IS NULL;
UPDATE "Teacher" SET "education" = 'Unassigned' WHERE "education" IS NULL;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "salary" SET NOT NULL,
ALTER COLUMN "salary" SET DEFAULT 0.0,
ALTER COLUMN "subject" SET NOT NULL,
ALTER COLUMN "subject" SET DEFAULT 'Unassigned',
ALTER COLUMN "designation" SET NOT NULL,
ALTER COLUMN "designation" SET DEFAULT 'Unassigned',
ALTER COLUMN "education" SET NOT NULL,
ALTER COLUMN "education" SET DEFAULT 'Unassigned';
