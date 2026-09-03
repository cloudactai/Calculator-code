-- CreateTable
CREATE TABLE "ComputationResult" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "matterId" INTEGER NOT NULL,
    "calculationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "inputSummary" JSONB NOT NULL,
    "resultSummary" JSONB NOT NULL,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComputationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComputationResult_userId_idx" ON "ComputationResult"("userId");

-- CreateIndex
CREATE INDEX "ComputationResult_matterId_idx" ON "ComputationResult"("matterId");

-- CreateIndex
CREATE INDEX "ComputationResult_matterId_calculationType_idx" ON "ComputationResult"("matterId", "calculationType");

-- AddForeignKey
ALTER TABLE "ComputationResult" ADD CONSTRAINT "ComputationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputationResult" ADD CONSTRAINT "ComputationResult_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
