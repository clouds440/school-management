-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "RequestMessage" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
