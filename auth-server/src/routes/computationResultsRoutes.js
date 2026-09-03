// Computation result routes: save and retrieve final computation results
// for a given matter. These are the "done/completed" results that persist
// independently of the full calculation report history.
//
// POST   /v1/matters/:matter_id/computation-results       – save a result
// GET    /v1/matters/:matter_id/computation-results       – list results
// GET    /v1/computation-results/:id                      – get one result
// PATCH  /v1/computation-results/:id                      – update (e.g. notes)
// DELETE /v1/computation-results/:id                      – delete a result

const express = require("express");
const prisma = require("../../prismaClient");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

const ok = (body) => ({ data: { code: 200, status: "success", body } });
const errorBody = (message, code = 404) => ({
  data: { code, status: "error", message },
});

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

// ── Save a computation result ──────────────────────────────────────────────
router.post("/matters/:matter_id/computation-results", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) return res.status(404).json(errorBody("Matter not found."));

    const body = req.body || {};
    if (!body.calculationType || !body.inputSummary || !body.resultSummary) {
      return res
        .status(400)
        .json(errorBody("calculationType, inputSummary, and resultSummary are required.", 400));
    }

    const result = await prisma.computationResult.create({
      data: {
        userId: req.user.id,
        matterId: matter.id,
        calculationType: body.calculationType,
        status: body.status || "completed",
        inputSummary: body.inputSummary,
        resultSummary: body.resultSummary,
        notes: body.notes || null,
        completedAt: new Date(),
      },
    });

    return res.json(ok({ id: result.id }));
  } catch (err) {
    console.log("POST /v1/matters/:id/computation-results failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not save computation result.", 500));
  }
});

// ── List computation results for a matter ──────────────────────────────────
router.get("/matters/:matter_id/computation-results", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) return res.json(ok([]));

    const results = await prisma.computationResult.findMany({
      where: { matterId: matter.id, userId: req.user.id },
      orderBy: { completedAt: "desc" },
    });

    return res.json(ok(results));
  } catch (err) {
    console.log("GET /v1/matters/:id/computation-results failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not list computation results.", 500));
  }
});

// ── Get a single computation result ────────────────────────────────────────
router.get("/computation-results/:id", async (req, res) => {
  try {
    const result = await prisma.computationResult.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    });
    if (!result) return res.status(404).json(errorBody("Not found."));
    return res.json(ok(result));
  } catch (err) {
    console.log("GET /v1/computation-results/:id failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not load computation result.", 500));
  }
});

// ── Update a computation result (notes, status) ───────────────────────────
router.patch("/computation-results/:id", async (req, res) => {
  try {
    const existing = await prisma.computationResult.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    });
    if (!existing) return res.status(404).json(errorBody("Not found."));

    const updates = {};
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.status !== undefined) updates.status = req.body.status;

    const result = await prisma.computationResult.update({
      where: { id: existing.id },
      data: updates,
    });

    return res.json(ok(result));
  } catch (err) {
    console.log("PATCH /v1/computation-results/:id failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not update computation result.", 500));
  }
});

// ── Delete a computation result ────────────────────────────────────────────
router.delete("/computation-results/:id", async (req, res) => {
  try {
    const existing = await prisma.computationResult.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    });
    if (!existing) return res.status(404).json(errorBody("Not found."));

    await prisma.computationResult.delete({ where: { id: existing.id } });
    return res.json(ok({ id: existing.id }));
  } catch (err) {
    console.log("DELETE /v1/computation-results/:id failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not delete computation result.", 500));
  }
});

module.exports = router;
