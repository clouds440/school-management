-- CreateTable
CREATE TABLE "ChatMembershipHistory" (
    "id" TEXT NOT NULL,
    "chatParticipantId" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "ChatMembershipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMembershipHistory_chatParticipantId_idx" ON "ChatMembershipHistory"("chatParticipantId");

-- AddForeignKey
ALTER TABLE "ChatMembershipHistory" ADD CONSTRAINT "ChatMembershipHistory_chatParticipantId_fkey" FOREIGN KEY ("chatParticipantId") REFERENCES "ChatParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
