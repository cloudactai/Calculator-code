-- Normalized Forms storage. Existing folders/files remain readable through
-- compatibility routes until the explicit backfill is run.
CREATE TABLE "FormTemplate" (
  "id" SERIAL PRIMARY KEY,
  "docId" TEXT NOT NULL UNIQUE,
  "province" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortTitle" TEXT,
  "fileName" TEXT NOT NULL,
  "footerText" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "productionReady" BOOLEAN NOT NULL DEFAULT false,
  "mappingReady" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "FormTemplateVersion" (
  "id" SERIAL PRIMARY KEY,
  "templateId" INTEGER NOT NULL REFERENCES "FormTemplate"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "pdfBytes" BYTEA,
  "fieldMapping" JSONB,
  "pageCount" INTEGER,
  "pdfChecksum" TEXT,
  "mappingChecksum" TEXT,
  "effectiveDate" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("templateId", "version")
);

CREATE TABLE "MatterFolder" (
  "id" SERIAL PRIMARY KEY,
  "matterId" INTEGER NOT NULL REFERENCES "Matter"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "normalizedTitle" TEXT NOT NULL,
  "type" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("matterId", "normalizedTitle")
);

CREATE TABLE "MatterFormDocument" (
  "id" SERIAL PRIMARY KEY,
  "matterId" INTEGER NOT NULL REFERENCES "Matter"("id") ON DELETE CASCADE,
  "folderId" INTEGER REFERENCES "MatterFolder"("id") ON DELETE SET NULL,
  "templateVersionId" INTEGER NOT NULL REFERENCES "FormTemplateVersion"("id") ON DELETE RESTRICT,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "fieldValues" JSONB NOT NULL DEFAULT '{}',
  "fieldProvenance" JSONB NOT NULL DEFAULT '{}',
  "generatedPdf" BYTEA,
  "generatedAt" TIMESTAMP(3),
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "MatterTaskState" (
  "id" SERIAL PRIMARY KEY,
  "matterId" INTEGER NOT NULL REFERENCES "Matter"("id") ON DELETE CASCADE,
  "taskKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("matterId", "taskKey")
);

ALTER TABLE "SavedCalculation" ADD COLUMN "matterDbId" INTEGER;
ALTER TABLE "SavedCalculation" ADD CONSTRAINT "SavedCalculation_matterDbId_fkey"
  FOREIGN KEY ("matterDbId") REFERENCES "Matter"("id") ON DELETE SET NULL;

CREATE INDEX "FormTemplate_province_productionReady_mappingReady_idx" ON "FormTemplate"("province", "productionReady", "mappingReady");
CREATE INDEX "FormTemplateVersion_templateId_active_idx" ON "FormTemplateVersion"("templateId", "active");
CREATE INDEX "MatterFolder_matterId_idx" ON "MatterFolder"("matterId");
CREATE INDEX "MatterFormDocument_matterId_folderId_idx" ON "MatterFormDocument"("matterId", "folderId");
CREATE INDEX "SavedCalculation_matterDbId_idx" ON "SavedCalculation"("matterDbId");
