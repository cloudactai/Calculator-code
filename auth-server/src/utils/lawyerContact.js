// Normalisation + validation for lawyer address book entries. Kept out of the
// route module so it can be unit-tested without a database.

// Long enough for real addresses, short enough that a runaway paste can't fill
// the table with a megabyte of text.
const MAX_FIELD_LENGTH = 255;

const text = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim().slice(0, MAX_FIELD_LENGTH);
};

// Accepts what the UI's Yes/No control and JSON clients send alike.
const bool = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const key = String(value).trim().toLowerCase();
  if (["yes", "true", "1", "y"].includes(key)) return true;
  if (["no", "false", "0", "n"].includes(key)) return false;
  return fallback;
};

// The shape the frontend address book reads. Nulls become "" so the form
// inputs stay controlled.
const lawyerRow = (row) => ({
  id: row.id,
  name: row.name,
  address: row.address || "",
  municipality: row.municipality || "",
  province: row.province || "",
  postalCode: row.postalCode || "",
  phone: row.phone || "",
  email: row.email || "",
  memberOfFirm: Boolean(row.memberOfFirm),
});

// name is the only required field: the address book is useful the moment a name
// exists, and the remaining details get filled in over time.
function readPayload(body) {
  const name = text(body?.name);
  if (!name) return { error: "Lawyer name is required." };
  return {
    values: {
      name,
      address: text(body?.address),
      municipality: text(body?.municipality),
      province: text(body?.province),
      postalCode: text(body?.postalCode),
      phone: text(body?.phone),
      email: text(body?.email),
      memberOfFirm: bool(body?.memberOfFirm),
    },
  };
}

module.exports = { MAX_FIELD_LENGTH, text, bool, lawyerRow, readPayload };
