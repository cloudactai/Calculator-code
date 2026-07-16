ALTER TABLE "MatterFormDocument"
  ADD COLUMN "generatedPdfRevision" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "MatterFormPdfRevision" (
  "id" SERIAL PRIMARY KEY,
  "documentId" INTEGER NOT NULL REFERENCES "MatterFormDocument"("id") ON DELETE CASCADE,
  "revision" INTEGER NOT NULL,
  "checksum" TEXT NOT NULL,
  "pdf" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("documentId", "revision")
);

CREATE INDEX "MatterFormPdfRevision_documentId_createdAt_idx"
  ON "MatterFormPdfRevision"("documentId", "createdAt");
