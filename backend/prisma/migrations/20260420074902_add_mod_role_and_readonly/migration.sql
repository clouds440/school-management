-- AlterEnum
ALTER TYPE "ChatParticipantRole" ADD VALUE 'MOD';

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "readOnly" BOOLEAN NOT NULL DEFAULT false;
