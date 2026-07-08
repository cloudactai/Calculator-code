-- CreateTable
CREATE TABLE "Matter" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "matterNumber" TEXT NOT NULL,
    "clientRole" TEXT,
    "childrenInvolved" TEXT,
    "province" TEXT,
    "checkedItems" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Internal',
    "informationCompleted" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 0,
    "firstflag" INTEGER NOT NULL DEFAULT 1,
    "valuationDate" TEXT,
    "fyIncomeBenefits" TEXT,
    "fyExpenses" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterRecord" (
    "id" SERIAL NOT NULL,
    "matterId" INTEGER NOT NULL,
    "dataType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatterRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCalculation" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "taxYear" TEXT,
    "status" TEXT,
    "type" TEXT,
    "calculatorType" TEXT,
    "matterId" TEXT,
    "data" TEXT,
    "reportUrl" TEXT,
    "reportData" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Matter_userId_idx" ON "Matter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Matter_userId_matterNumber_key" ON "Matter"("userId", "matterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MatterRecord_matterId_dataType_key" ON "MatterRecord"("matterId", "dataType");

-- CreateIndex
CREATE INDEX "SavedCalculation_userId_idx" ON "SavedCalculation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCalculation_userId_label_key" ON "SavedCalculation"("userId", "label");

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterRecord" ADD CONSTRAINT "MatterRecord_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCalculation" ADD CONSTRAINT "SavedCalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
