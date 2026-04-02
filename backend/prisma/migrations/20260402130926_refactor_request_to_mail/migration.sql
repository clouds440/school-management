/*
  Warnings:

  - You are about to drop the `Request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RequestActionLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RequestMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RequestUserView` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RequestParticipants` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED', 'NO_REPLY');

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "RequestActionLog" DROP CONSTRAINT "RequestActionLog_performedBy_fkey";

-- DropForeignKey
ALTER TABLE "RequestActionLog" DROP CONSTRAINT "RequestActionLog_requestId_fkey";

-- DropForeignKey
ALTER TABLE "RequestMessage" DROP CONSTRAINT "RequestMessage_requestId_fkey";

-- DropForeignKey
ALTER TABLE "RequestMessage" DROP CONSTRAINT "RequestMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "RequestUserView" DROP CONSTRAINT "RequestUserView_requestId_fkey";

-- DropForeignKey
ALTER TABLE "RequestUserView" DROP CONSTRAINT "RequestUserView_userId_fkey";

-- DropForeignKey
ALTER TABLE "_RequestParticipants" DROP CONSTRAINT "_RequestParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_RequestParticipants" DROP CONSTRAINT "_RequestParticipants_B_fkey";

-- DropTable
DROP TABLE "Request";

-- DropTable
DROP TABLE "RequestActionLog";

-- DropTable
DROP TABLE "RequestMessage";

-- DropTable
DROP TABLE "RequestUserView";

-- DropTable
DROP TABLE "_RequestParticipants";

-- DropEnum
DROP TYPE "RequestStatus";

-- CreateTable
CREATE TABLE "Mail" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "MailStatus" NOT NULL DEFAULT 'OPEN',
    "creatorId" TEXT NOT NULL,
    "creatorRole" TEXT NOT NULL,
    "organizationId" TEXT,
    "targetRole" TEXT,
    "assigneeId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailUserView" (
    "userId" TEXT NOT NULL,
    "mailId" TEXT NOT NULL,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailUserView_pkey" PRIMARY KEY ("userId","mailId")
);

-- CreateTable
CREATE TABLE "MailMessage" (
    "id" TEXT NOT NULL,
    "mailId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailActionLog" (
    "id" TEXT NOT NULL,
    "mailId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MailParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MailParticipants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Mail_creatorId_idx" ON "Mail"("creatorId");

-- CreateIndex
CREATE INDEX "Mail_organizationId_idx" ON "Mail"("organizationId");

-- CreateIndex
CREATE INDEX "Mail_status_idx" ON "Mail"("status");

-- CreateIndex
CREATE INDEX "Mail_assigneeId_idx" ON "Mail"("assigneeId");

-- CreateIndex
CREATE INDEX "MailMessage_mailId_idx" ON "MailMessage"("mailId");

-- CreateIndex
CREATE INDEX "MailMessage_senderId_idx" ON "MailMessage"("senderId");

-- CreateIndex
CREATE INDEX "MailActionLog_mailId_idx" ON "MailActionLog"("mailId");

-- CreateIndex
CREATE INDEX "_MailParticipants_B_index" ON "_MailParticipants"("B");

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailUserView" ADD CONSTRAINT "MailUserView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailUserView" ADD CONSTRAINT "MailUserView_mailId_fkey" FOREIGN KEY ("mailId") REFERENCES "Mail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_mailId_fkey" FOREIGN KEY ("mailId") REFERENCES "Mail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailActionLog" ADD CONSTRAINT "MailActionLog_mailId_fkey" FOREIGN KEY ("mailId") REFERENCES "Mail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailActionLog" ADD CONSTRAINT "MailActionLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MailParticipants" ADD CONSTRAINT "_MailParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "Mail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MailParticipants" ADD CONSTRAINT "_MailParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
