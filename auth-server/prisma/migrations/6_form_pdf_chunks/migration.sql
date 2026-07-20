CREATE TABLE "MatterFormPdfChunk" (
  "id" SERIAL PRIMARY KEY,
  "revisionId" INTEGER NOT NULL REFERENCES "MatterFormPdfRevision"("id") ON DELETE CASCADE,
  "position" INTEGER NOT NULL,
  "pdf" BYTEA NOT NULL,
  UNIQUE ("revisionId", "position")
);

CREATE INDEX "MatterFormPdfChunk_revisionId_position_idx"
  ON "MatterFormPdfChunk"("revisionId", "position");
