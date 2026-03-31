-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "type" "ChatMessageType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "ChatParticipant" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
