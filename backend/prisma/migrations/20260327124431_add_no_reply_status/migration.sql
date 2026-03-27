-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'NO_REPLY';

-- CreateTable
CREATE TABLE "RequestUserView" (
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestUserView_pkey" PRIMARY KEY ("userId","requestId")
);

-- CreateTable
CREATE TABLE "_RequestParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RequestParticipants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RequestParticipants_B_index" ON "_RequestParticipants"("B");

-- AddForeignKey
ALTER TABLE "RequestUserView" ADD CONSTRAINT "RequestUserView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestUserView" ADD CONSTRAINT "RequestUserView_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestParticipants" ADD CONSTRAINT "_RequestParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestParticipants" ADD CONSTRAINT "_RequestParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
