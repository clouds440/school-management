-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "dueDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "updatedBy" TEXT;
