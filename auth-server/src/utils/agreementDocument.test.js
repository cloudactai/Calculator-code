const test = require("node:test");
const assert = require("node:assert");

const {
  agreementDto,
  agreementFolderDto,
  DEFAULT_PDF_FILENAME,
} = require("./agreementDocument");

const GENERATED_AT = new Date("2026-09-04T14:30:00.000Z");
const CREATED_AT = new Date("2026-09-01T09:00:00.000Z");
const UPDATED_AT = new Date("2026-09-04T14:31:00.000Z");

const row = (overrides = {}) => ({
  id: 7,
  userId: "user-1",
  matterId: 42,
  folderId: 3,
  agreementType: "separation_agreement",
  answers: { children: { arrangement: "shared" } },
  transcript: [{ role: "user", text: "hi" }],
  status: "draft",
  revision: 4,
  pdfFilename: "separation_agreement_M-2026-01.pdf",
  generatedAt: GENERATED_AT,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  ...overrides,
});

// ── agreementDto (resume shape) ───────────────────────────────────────────────

test("agreementDto carries answers and transcript back for resume", () => {
  const dto = agreementDto(row({ pdfBytes: Buffer.from("%PDF-1.4") }));
  assert.deepStrictEqual(dto.answers, { children: { arrangement: "shared" } });
  assert.deepStrictEqual(dto.transcript, [{ role: "user", text: "hi" }]);
  assert.strictEqual(dto.hasPdf, true);
  assert.strictEqual(dto.revision, 4);
});

test("agreementDto defaults a row with no answers or transcript", () => {
  const dto = agreementDto(row({ answers: null, transcript: null }));
  assert.deepStrictEqual(dto.answers, {});
  assert.deepStrictEqual(dto.transcript, []);
});

test("agreementDto never leaks the PDF bytes themselves", () => {
  const dto = agreementDto(row({ pdfBytes: Buffer.from("%PDF-1.4") }));
  assert.ok(!("pdfBytes" in dto));
});

test("agreementDto passes a missing row straight through as null", () => {
  assert.strictEqual(agreementDto(null), null);
  assert.strictEqual(agreementDto(undefined), null);
});

// ── agreementFolderDto (Documents folder shape) ───────────────────────────────

test("agreementFolderDto shapes a generated agreement as a folder document", () => {
  assert.deepStrictEqual(agreementFolderDto(row()), {
    kind: "agreement",
    id: 7,
    matter_id: 42,
    folder_id: 3,
    agreement_type: "separation_agreement",
    file_name: "separation_agreement_M-2026-01.pdf",
    status: "draft",
    revision: 4,
    has_pdf: true,
    generated: GENERATED_AT,
    created: CREATED_AT,
    updated: UPDATED_AT,
  });
});

test("agreementFolderDto keys match what the folder table renders", () => {
  // The Documents folder renders form documents and agreements in one table
  // off these keys (formsRoutes.js documentDto uses the same names).
  const dto = agreementFolderDto(row());
  for (const key of ["id", "file_name", "status", "updated", "folder_id"]) {
    assert.ok(key in dto, `missing ${key}`);
  }
});

test("agreementFolderDto falls back to a default filename", () => {
  assert.strictEqual(agreementFolderDto(row({ pdfFilename: null })).file_name, DEFAULT_PDF_FILENAME);
  assert.strictEqual(agreementFolderDto(row({ pdfFilename: "" })).file_name, DEFAULT_PDF_FILENAME);
});

test("agreementFolderDto reads has_pdf from generatedAt when bytes weren't selected", () => {
  // Listing deliberately omits pdfBytes from the select — generatedAt is
  // written in the same update as the bytes, so it stands in for them.
  const listed = row();
  delete listed.pdfBytes;
  assert.strictEqual(agreementFolderDto(listed).has_pdf, true);
});

test("agreementFolderDto reports has_pdf false for a draft that was never generated", () => {
  const dto = agreementFolderDto(row({ generatedAt: null, pdfFilename: null }));
  assert.strictEqual(dto.has_pdf, false);
  assert.strictEqual(dto.generated, null);
});

test("agreementFolderDto marks the row as an agreement, not a form", () => {
  assert.strictEqual(agreementFolderDto(row()).kind, "agreement");
});

test("agreementFolderDto passes a missing row straight through as null", () => {
  assert.strictEqual(agreementFolderDto(null), null);
});
