// Draft Agreements: persistence for MatterAgreementDocument — one row per
// (matter, agreementType) holding the chat's collected answers, its display
// transcript, and the generated PDF once one exists. Sibling to
// calculationReportsRoutes.js, but resumable rather than write-once: the same
// row is read back and updated across visits instead of creating a new report
// each time.
//
// GET    /v1/matters/:matter_id/agreements                          – list generated agreements (Documents folder view)
// GET    /v1/matters/:matter_id/agreements/:agreement_type          – load for resume (answers + transcript)
// PUT    /v1/matters/:matter_id/agreements/:agreement_type          – save draft (answers + transcript)
// POST   /v1/matters/:matter_id/agreements/:agreement_type/reset    – clear transcript + answers only
// PUT    /v1/matters/:matter_id/agreements/:agreement_type/pdf      – save the generated PDF
// GET    /v1/matters/:matter_id/agreements/:agreement_type/pdf      – download the generated PDF

const crypto = require("crypto");
const express = require("express");
const prisma = require("../../prismaClient");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  agreementDto,
  agreementFolderDto,
  DEFAULT_PDF_FILENAME,
} = require("../utils/agreementDocument");

const router = express.Router();
router.use(authMiddleware);

const ok = (body) => ({ data: { code: 200, status: "success", body } });
const errorBody = (message, code = 404) => ({
  data: { code, status: "error", message },
});

// Only agreement types the registry actually ships (cloudact-ui
// .../agreementTypes.js) are ever persisted. Keeps a typo'd type from
// silently creating an orphan row nothing will ever read back.
const KNOWN_AGREEMENT_TYPES = new Set(["separation_agreement"]);

const FOLDER_TITLE = "Separation Agreements";
const normaliseFolderTitle = (value) =>
  String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();

async function matterForUser(userId, matterParam) {
  const asNumber = Number(matterParam);
  return prisma.matter.findFirst({
    where: {
      userId,
      OR: [
        { matterNumber: String(matterParam) },
        ...(Number.isInteger(asNumber) && asNumber > 0 ? [{ id: asNumber }] : []),
      ],
    },
  });
}

function validAgreementType(value) {
  return KNOWN_AGREEMENT_TYPES.has(String(value || ""));
}

// ── List this matter's generated agreements ─────────────────────────────────
// What makes a generated agreement visible in the matter's Documents folder:
// the folder view lists MatterFormDocument rows, which an agreement is not, so
// without this route a PDF filed into "Separation Agreements" sat in the
// database with nothing able to show it. Drafts that have never been generated
// have no folder and are excluded — only a real PDF is a document.
router.get("/matters/:matter_id/agreements", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matter_id);
  if (!matter) return res.status(404).json(errorBody("Matter not found."));

  const { folderId } = req.query;
  let folderFilter = {};
  if (folderId !== undefined && folderId !== "") {
    const asNumber = Number(folderId);
    if (!Number.isInteger(asNumber) || asNumber <= 0) {
      return res.status(400).json(errorBody("folderId must be a positive integer.", 400));
    }
    folderFilter = { folderId: asNumber };
  }

  const rows = await prisma.matterAgreementDocument.findMany({
    where: { matterId: matter.id, generatedAt: { not: null }, ...folderFilter },
    select: {
      id: true,
      matterId: true,
      folderId: true,
      agreementType: true,
      pdfFilename: true,
      status: true,
      revision: true,
      generatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return res.json(ok(rows.map(agreementFolderDto)));
});

// ── Load for resume ─────────────────────────────────────────────────────────
router.get("/matters/:matter_id/agreements/:agreement_type", async (req, res) => {
  if (!validAgreementType(req.params.agreement_type)) {
    return res.status(400).json(errorBody("Unknown agreement type.", 400));
  }
  const matter = await matterForUser(req.user.id, req.params.matter_id);
  if (!matter) return res.status(404).json(errorBody("Matter not found."));

  const row = await prisma.matterAgreementDocument.findUnique({
    where: { matterId_agreementType: { matterId: matter.id, agreementType: req.params.agreement_type } },
  });
  return res.json(ok(agreementDto(row)));
});

// ── Save draft (answers + transcript only — never the PDF) ─────────────────
router.put("/matters/:matter_id/agreements/:agreement_type", async (req, res) => {
  if (!validAgreementType(req.params.agreement_type)) {
    return res.status(400).json(errorBody("Unknown agreement type.", 400));
  }
  const matter = await matterForUser(req.user.id, req.params.matter_id);
  if (!matter) return res.status(404).json(errorBody("Matter not found."));

  const answers = req.body?.answers;
  const transcript = req.body?.transcript;
  if (answers !== undefined && (typeof answers !== "object" || Array.isArray(answers))) {
    return res.status(400).json(errorBody("answers must be an object.", 400));
  }
  if (transcript !== undefined && !Array.isArray(transcript)) {
    return res.status(400).json(errorBody("transcript must be an array.", 400));
  }

  const row = await prisma.matterAgreementDocument.upsert({
    where: { matterId_agreementType: { matterId: matter.id, agreementType: req.params.agreement_type } },
    create: {
      userId: req.user.id,
      matterId: matter.id,
      agreementType: req.params.agreement_type,
      answers: answers ?? {},
      transcript: transcript ?? [],
    },
    update: {
      ...(answers !== undefined ? { answers } : {}),
      ...(transcript !== undefined ? { transcript } : {}),
      revision: { increment: 1 },
    },
  });
  return res.status(201).json(ok(agreementDto(row)));
});

// ── Reset Chat: clears transcript + answers on this row only ───────────────
// Never touches MatterRecord (this chat never writes there) and never clears
// a PDF that was already generated on purpose.
router.post("/matters/:matter_id/agreements/:agreement_type/reset", async (req, res) => {
  if (!validAgreementType(req.params.agreement_type)) {
    return res.status(400).json(errorBody("Unknown agreement type.", 400));
  }
  const matter = await matterForUser(req.user.id, req.params.matter_id);
  if (!matter) return res.status(404).json(errorBody("Matter not found."));

  const row = await prisma.matterAgreementDocument.upsert({
    where: { matterId_agreementType: { matterId: matter.id, agreementType: req.params.agreement_type } },
    create: {
      userId: req.user.id,
      matterId: matter.id,
      agreementType: req.params.agreement_type,
      answers: {},
      transcript: [],
    },
    update: {
      answers: {},
      transcript: [],
      revision: { increment: 1 },
    },
  });
  return res.json(ok(agreementDto(row)));
});

// ── Save the generated PDF ──────────────────────────────────────────────────
// Filed into a per-matter "Separation Agreements" folder, the same way form
// documents are organized into MatterFolder, so it lives wherever Documents
// already looks for this matter's paperwork.
router.put(
  "/matters/:matter_id/agreements/:agreement_type/pdf",
  express.raw({ type: "application/pdf", limit: "20mb" }),
  async (req, res) => {
    if (!validAgreementType(req.params.agreement_type)) {
      return res.status(400).json(errorBody("Unknown agreement type.", 400));
    }
    const matter = await matterForUser(req.user.id, req.params.matter_id);
    if (!matter) return res.status(404).json(errorBody("Matter not found."));

    const pdf = req.body;
    if (!Buffer.isBuffer(pdf) || pdf.length === 0 || pdf.subarray(0, 4).toString() !== "%PDF") {
      return res.status(400).json(errorBody("A PDF under 20 MB is required.", 400));
    }
    if (pdf.length > 20 * 1024 * 1024) {
      return res.status(400).json(errorBody("A PDF under 20 MB is required.", 400));
    }

    const filename = String(req.query.filename || DEFAULT_PDF_FILENAME);
    const checksum = crypto.createHash("sha256").update(pdf).digest("hex");

    const folder = await prisma.matterFolder.upsert({
      where: { matterId_normalizedTitle: { matterId: matter.id, normalizedTitle: normaliseFolderTitle(FOLDER_TITLE) } },
      create: { matterId: matter.id, title: FOLDER_TITLE, normalizedTitle: normaliseFolderTitle(FOLDER_TITLE), type: "agreements" },
      update: {},
    });

    const row = await prisma.matterAgreementDocument.upsert({
      where: { matterId_agreementType: { matterId: matter.id, agreementType: req.params.agreement_type } },
      create: {
        userId: req.user.id,
        matterId: matter.id,
        folderId: folder.id,
        agreementType: req.params.agreement_type,
        pdfBytes: pdf,
        pdfFilename: filename,
        generatedAt: new Date(),
      },
      update: {
        folderId: folder.id,
        pdfBytes: pdf,
        pdfFilename: filename,
        generatedAt: new Date(),
        revision: { increment: 1 },
      },
    });

    return res.json(ok({ ...agreementDto(row), checksum }));
  }
);

// ── Download the generated PDF ──────────────────────────────────────────────
router.get("/matters/:matter_id/agreements/:agreement_type/pdf", async (req, res) => {
  if (!validAgreementType(req.params.agreement_type)) {
    return res.status(400).json(errorBody("Unknown agreement type.", 400));
  }
  const matter = await matterForUser(req.user.id, req.params.matter_id);
  if (!matter) return res.status(404).json(errorBody("Matter not found."));

  const row = await prisma.matterAgreementDocument.findUnique({
    where: { matterId_agreementType: { matterId: matter.id, agreementType: req.params.agreement_type } },
    select: { pdfBytes: true, pdfFilename: true },
  });
  if (!row?.pdfBytes) return res.status(404).json(errorBody("No PDF has been generated yet."));

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${row.pdfFilename || DEFAULT_PDF_FILENAME}"`
  );
  return res.send(row.pdfBytes);
});

module.exports = router;
