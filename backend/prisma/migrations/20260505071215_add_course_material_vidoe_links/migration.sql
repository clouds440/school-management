-- AlterTable
ALTER TABLE "CourseMaterial" ADD COLUMN     "isVideoLink" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "links" TEXT[];
