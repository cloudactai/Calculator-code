// Shapes for MatterAgreementDocument rows.
//
// Two different consumers, two different shapes:
//   - agreementDto()        – the Draft Agreements panel resuming a draft
//                             (answers + transcript + whether a PDF exists).
//   - agreementFolderDto()  – the matter's Documents folder listing. Keys
//                             deliberately mirror formsRoutes.js's
//                             documentDto() (id / file_name / status /
//                             created / updated) so a folder can render form
//                             documents and generated agreements in one
//                             table; `kind` is what tells them apart.

const DEFAULT_PDF_FILENAME = "separation_agreement.pdf";

function agreementDto(row) {
  if (!row) return null;
  return {
    id: row.id,
    agreementType: row.agreementType,
    answers: row.answers ?? {},
    transcript: row.transcript ?? [],
    status: row.status,
    revision: row.revision,
    hasPdf: !!row.pdfBytes,
    generatedAt: row.generatedAt,
    updatedAt: row.updatedAt,
  };
}

/** A generated agreement as it appears inside a Documents folder. Listing
 * never selects `pdfBytes` — pulling every PDF's bytes out of the database
 * just to render a filename would be wasteful — so "has a PDF" is read from
 * `generatedAt`, which is written in the same update that stores the bytes. */
function agreementFolderDto(row) {
  if (!row) return null;
  return {
    kind: "agreement",
    id: row.id,
    matter_id: row.matterId,
    folder_id: row.folderId,
    agreement_type: row.agreementType,
    file_name: row.pdfFilename || DEFAULT_PDF_FILENAME,
    status: row.status,
    revision: row.revision,
    has_pdf: row.pdfBytes ? true : !!row.generatedAt,
    generated: row.generatedAt ?? null,
    created: row.createdAt,
    updated: row.updatedAt,
  };
}

module.exports = { agreementDto, agreementFolderDto, DEFAULT_PDF_FILENAME };
