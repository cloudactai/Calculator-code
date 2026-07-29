// Lawyer address book: the per-user list of lawyers shown in the "Lawyer
// details" modal on the Background information form. Selecting an entry there
// auto-fills the party's lawyer block (name/address/municipality/postal
// code/phone/email/province).
//
// Wire compatibility: like the other /v1 routes these respond with the legacy
// wrapper { data: { code, status, body } } so the frontend keeps one shape.
// Ownership always comes from the authenticated user - there is no :sid.
const express = require("express");
const prisma = require("../../prismaClient");
const { authMiddleware } = require("../middleware/authMiddleware");
const { lawyerRow, readPayload } = require("../utils/lawyerContact");

const router = express.Router();
router.use(authMiddleware);

const ok = (body) => ({ data: { code: 200, status: "success", body } });
const errorBody = (message, code = 404) => ({
  data: { code, status: "error", message },
});

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

router.get("/lawyers", async (req, res) => {
  try {
    const rows = await prisma.lawyerContact.findMany({
      where: { userId: req.user.id },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
    return res.json(ok(rows.map(lawyerRow)));
  } catch (err) {
    console.log("GET /v1/lawyers failed:", err?.message || err);
    return res
      .status(500)
      .json(errorBody("Could not load the lawyer address book.", 500));
  }
});

router.post("/lawyers", async (req, res) => {
  const { error, values } = readPayload(req.body);
  if (error) return res.status(400).json(errorBody(error, 400));
  try {
    const created = await prisma.lawyerContact.create({
      data: { ...values, userId: req.user.id },
    });
    return res.json(ok(lawyerRow(created)));
  } catch (err) {
    console.log("POST /v1/lawyers failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not save the lawyer.", 500));
  }
});

router.put("/lawyers/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json(errorBody("Invalid lawyer id.", 400));
  const { error, values } = readPayload(req.body);
  if (error) return res.status(400).json(errorBody(error, 400));
  try {
    // updateMany scopes the write to the owner, so another user's id is a
    // no-op rather than an edit.
    const { count } = await prisma.lawyerContact.updateMany({
      where: { id, userId: req.user.id },
      data: values,
    });
    if (!count) return res.status(404).json(errorBody("Lawyer not found."));
    const updated = await prisma.lawyerContact.findUnique({ where: { id } });
    return res.json(ok(lawyerRow(updated)));
  } catch (err) {
    console.log("PUT /v1/lawyers failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not update the lawyer.", 500));
  }
});

router.delete("/lawyers/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json(errorBody("Invalid lawyer id.", 400));
  try {
    const { count } = await prisma.lawyerContact.deleteMany({
      where: { id, userId: req.user.id },
    });
    if (!count) return res.status(404).json(errorBody("Lawyer not found."));
    return res.json(ok({ id }));
  } catch (err) {
    console.log("DELETE /v1/lawyers failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not delete the lawyer.", 500));
  }
});

module.exports = router;
