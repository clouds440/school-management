/*
  Warnings:

  - You are about to drop the `SupportTicket` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_organizationId_fkey";

-- DropTable
DROP TABLE "SupportTicket";

-- DropEnum
DROP TYPE "SupportTopic";
