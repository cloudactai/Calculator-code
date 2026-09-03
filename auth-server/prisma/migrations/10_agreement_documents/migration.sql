-- Draft Agreements: one row per (matter, agreementType) holding the chat's
-- collected answers, its display transcript, and the generated PDF once one
-- exists. The DDL is exactly what `prisma migrate diff --from-schema-datamodel
-- --to-schema-datamodel prisma/schema.prisma` emits for MatterAgreementDocument,
-- so the schema and the deployed database stay drift-free.

-- CreateTable
CREATE TABLE "MatterAgreementDocument" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "matterId" INTEGER NOT NULL,
    "folderId" INTEGER,
    "agreementType" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "pdfBytes" BYTEA,
    "pdfFilename" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatterAgreementDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatterAgreementDocument_userId_idx" ON "MatterAgreementDocument"("userId");

-- CreateIndex
CREATE INDEX "MatterAgreementDocument_matterId_idx" ON "MatterAgreementDocument"("matterId");

-- CreateIndex
CREATE UNIQUE INDEX "MatterAgreementDocument_matterId_agreementType_key" ON "MatterAgreementDocument"("matterId", "agreementType");

-- AddForeignKey
ALTER TABLE "MatterAgreementDocument" ADD CONSTRAINT "MatterAgreementDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAgreementDocument" ADD CONSTRAINT "MatterAgreementDocument_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAgreementDocument" ADD CONSTRAINT "MatterAgreementDocument_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MatterFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

