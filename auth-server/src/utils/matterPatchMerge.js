const DEFAULT_IGNORED_CONTENT_FIELDS = new Set([
  "id",
  "role",
  "incomeBenefit",
  "expenseType",
  "financialYear",
  "asset_type",
]);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isBlankValue = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const mergeNonBlank = (existing, incoming) => {
  if (isBlankValue(incoming)) return existing;

  if (isPlainObject(incoming)) {
    const result = isPlainObject(existing) ? { ...existing } : {};
    for (const [key, value] of Object.entries(incoming)) {
      result[key] = mergeNonBlank(result[key], value);
    }
    return result;
  }

  if (Array.isArray(incoming)) {
    return incoming.length > 0 ? [...incoming] : existing;
  }

  // Numeric zero and boolean false are intentional values and must be retained.
  return incoming;
};

const identityValue = (value) =>
  String(value ?? "").trim().toLowerCase();

const matchesFields = (existing, incoming, fields) =>
  fields.every(
    (field) =>
      !isBlankValue(incoming?.[field]) &&
      identityValue(existing?.[field]) === identityValue(incoming[field])
  );

const hasMeaningfulContent = (
  value,
  ignoredFields = DEFAULT_IGNORED_CONTENT_FIELDS,
  currentKey = ""
) => {
  if (ignoredFields.has(currentKey)) return false;
  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulContent(item, ignoredFields));
  }
  if (isPlainObject(value)) {
    return Object.entries(value).some(([key, item]) =>
      hasMeaningfulContent(item, ignoredFields, key)
    );
  }
  return !isBlankValue(value);
};

const findMatchingRowIndex = (
  rows,
  incoming,
  { identityGroups = [], singleton = false, uniqueFallbackFields = [] }
) => {
  if (!isBlankValue(incoming?.id)) {
    const idIndex = rows.findIndex(
      (row) => identityValue(row?.id) === identityValue(incoming.id)
    );
    if (idIndex >= 0) return idIndex;
  }

  let suppliedCompleteIdentity = false;
  for (const fields of identityGroups) {
    if (fields.every((field) => !isBlankValue(incoming?.[field]))) {
      suppliedCompleteIdentity = true;
    }
    const matches = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => matchesFields(row, incoming, fields));
    if (matches.length > 1) {
      const error = new Error(
        `Ambiguous patch: more than one row matches identity ${fields.join(", ")}.`
      );
      error.code = "AMBIGUOUS_PATCH";
      throw error;
    }
    if (matches.length === 1) return matches[0].index;
  }

  if (
    !suppliedCompleteIdentity &&
    uniqueFallbackFields.length > 0 &&
    uniqueFallbackFields.every((field) => !isBlankValue(incoming?.[field]))
  ) {
    const candidates = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => matchesFields(row, incoming, uniqueFallbackFields));
    if (candidates.length > 1) {
      const error = new Error(
        `Ambiguous patch: more than one row matches fallback identity ${uniqueFallbackFields.join(", ")}.`
      );
      error.code = "AMBIGUOUS_PATCH";
      throw error;
    }
    if (candidates.length === 1) return candidates[0].index;
  }

  return singleton && rows.length > 0 ? 0 : -1;
};

const mergeRecordRows = (existingRows, incomingRows, options = {}) => {
  const result = (Array.isArray(existingRows) ? existingRows : []).map((row) => ({
    ...row,
  }));

  for (const incoming of Array.isArray(incomingRows) ? incomingRows : []) {
    if (!incoming || typeof incoming !== "object") continue;

    const matchIndex = findMatchingRowIndex(result, incoming, options);
    if (matchIndex >= 0) {
      result[matchIndex] = mergeNonBlank(result[matchIndex], incoming);
      continue;
    }

    // Claude is instructed to emit empty strings for unknown values. Do not
    // turn a placeholder-only object into a new blank database row.
    if (hasMeaningfulContent(incoming)) result.push(mergeNonBlank({}, incoming));
  }

  return result;
};

module.exports = {
  hasMeaningfulContent,
  isBlankValue,
  mergeNonBlank,
  mergeRecordRows,
};
