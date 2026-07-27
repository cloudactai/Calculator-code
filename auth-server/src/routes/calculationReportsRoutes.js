// Calculation report routes: save and retrieve calculation reports (with PDF)
// for a given matter. The PDF is stored as raw bytes in Postgres.
//
// POST /v1/matters/:matter_id/reports       – save a new report
// GET  /v1/matters/:matter_id/reports       – list reports for a matter
// GET  /v1/reports/:id/pdf                  – download the PDF for a report
// DELETE /v1/reports/:id                    – delete a report

const express = require("express");
const prisma = require("../../prismaClient");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

const ok = (body) => ({ data: { code: 200, status: "success", body } });
const errorBody = (message, code = 404) => ({
  data: { code, status: "error", message },
});

// Helper: find matter by matterNumber or numeric id (same as mattersRoutes)
async function findMatter(userId, matterParam) {
  const asNumber = Number(matterParam);
  return prisma.matter.findFirst({
    where: {
      userId,
      OR: [
        { matterNumber: String(matterParam) },
        ...(Number.isInteger(asNumber) && asNumber > 0
          ? [{ id: asNumber }]
          : []),
      ],
    },
  });
}

// ── Save a calculation report ───────────────────────────────────────────────
// Body: {
//   calculationType: "child_support" | "spousal_support",
//   taxYear?:        "2026",
//   label?:          "Smith v Jones - Jan 2026",
//   inputData:       { ... calculation inputs ... },
//   resultData:      { ... calculation outputs ... },
//   pdfBase64?:      "JVBERi0x...",          // base64-encoded PDF
//   pdfFilename?:    "child_support_report.pdf"
// }
router.post("/matters/:matter_id/reports", async (req, res) => {
  try {
    console.log("[DEBUG calculationReports] userId from JWT:", req.user.id);
    console.log("[DEBUG calculationReports] matter_id from URL:", req.params.matter_id);
    const matter = await findMatter(req.user.id, req.params.matter_id);
    console.log("[DEBUG calculationReports] findMatter result:", matter ? { id: matter.id, matterNumber: matter.matterNumber, userId: matter.userId } : null);
    if (!matter) return res.status(404).json(errorBody("Matter not found."));

    const body = req.body || {};
    if (!body.calculationType || !body.inputData || !body.resultData) {
      return res
        .status(400)
        .json(errorBody("calculationType, inputData, and resultData are required.", 400));
    }

    const pdfBytes = body.pdfBase64
      ? Buffer.from(body.pdfBase64, "base64")
      : null;

    const report = await prisma.matterCalculationReport.create({
      data: {
        userId: req.user.id,
        matterId: matter.id,
        calculationType: body.calculationType,
        taxYear: body.taxYear || null,
        label: body.label || null,
        inputData: body.inputData,
        resultData: body.resultData,
        pdfBytes,
        pdfFilename: body.pdfFilename || null,
      },
    });

    return res.json(ok({ id: report.id }));
  } catch (err) {
    console.log("POST /v1/matters/:id/reports failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not save report.", 500));
  }
});

// ── List reports for a matter ───────────────────────────────────────────────
router.get("/matters/:matter_id/reports", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) return res.json(ok([]));

    const reports = await prisma.matterCalculationReport.findMany({
      where: { matterId: matter.id, userId: req.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        calculationType: true,
        taxYear: true,
        label: true,
        inputData: true,
        resultData: true,
        pdfFilename: true,
        createdAt: true,
        // Exclude pdfBytes from listing — it's large
      },
    });

    return res.json(ok(reports));
  } catch (err) {
    console.log("GET /v1/matters/:id/reports failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not list reports.", 500));
  }
});

// ── Download a report PDF ───────────────────────────────────────────────────
router.get("/reports/:id/pdf", async (req, res) => {
  try {
    const report = await prisma.matterCalculationReport.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
      select: { pdfBytes: true, pdfFilename: true },
    });

    if (!report || !report.pdfBytes) {
      return res.status(404).json(errorBody("PDF not found."));
    }

    const filename = report.pdfFilename || "calculation_report.pdf";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(report.pdfBytes);
  } catch (err) {
    console.log("GET /v1/reports/:id/pdf failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not download PDF.", 500));
  }
});

// ── Delete a report ─────────────────────────────────────────────────────────
router.delete("/reports/:id", async (req, res) => {
  try {
    const report = await prisma.matterCalculationReport.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    });
    if (!report) return res.status(404).json(errorBody("Not found."));

    await prisma.matterCalculationReport.delete({ where: { id: report.id } });
    return res.json(ok({ id: report.id }));
  } catch (err) {
    console.log("DELETE /v1/reports/:id failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not delete report.", 500));
  }
});

module.exports = router;
