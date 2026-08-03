// Append-only record of values changed on a matter.
//
// Each entry is one save: when it happened, what made it, and the verified
// before/after pairs the write endpoint read back. This is the durable half of
// the Update Information feature — the conversation itself is deliberately not
// kept (its primer goes stale the moment anything changes, and replaying it
// would resend the client's whole financial record to the model every turn),
// but the record of what was amended is worth keeping for the life of a matter.
//
// Stored in MatterRecord under one dataType, so the whole log is a single JSON
// column. Everything below is bounded to keep that column from growing without
// limit.

const MAX_ENTRIES = 200;
const MAX_CHANGES_PER_ENTRY = 50;
const MAX_TEXT_LENGTH = 500;

const CHANGE_LOG_TYPE = "matter_change_log";

const trimmed = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).slice(0, MAX_TEXT_LENGTH);
};

/**
 * Validate and clamp the changes a caller wants recorded.
 *
 * @returns {{label: string, from: string, to: string}[]|null} null when the
 *          payload is not a usable list of changes.
 */
function sanitizeChanges(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const changes = raw
    .filter((change) => change && typeof change === "object" && !Array.isArray(change))
    .map((change) => ({
      label: trimmed(change.label),
      from: trimmed(change.from),
      to: trimmed(change.to),
    }))
    // A change with nothing to identify it is not worth recording.
    .filter((change) => change.label !== "")
    .slice(0, MAX_CHANGES_PER_ENTRY);

  return changes.length > 0 ? changes : null;
}

/**
 * Build one log entry. `at` is injectable so tests do not depend on the clock.
 */
function buildEntry({ changes, source, at = new Date() }) {
  return {
    at: at.toISOString(),
    source: trimmed(source) || "ai-update",
    changes,
  };
}

/**
 * Append an entry, keeping the log newest-last and bounded. Oldest entries are
 * dropped once the cap is reached — the recent history is what gets read.
 */
function appendEntry(existing, entry) {
  const entries = Array.isArray(existing) ? existing.filter(Boolean) : [];
  const appended = [...entries, entry];
  const capped = appended.slice(-MAX_ENTRIES);
  // Ids are positional and reassigned on every write, matching how the other
  // matter record collections are stored.
  return capped.map((item, index) => ({ ...item, id: index + 1 }));
}

/** Newest first, for display. */
function newestFirst(entries) {
  return Array.isArray(entries) ? [...entries].filter(Boolean).reverse() : [];
}

module.exports = {
  CHANGE_LOG_TYPE,
  MAX_ENTRIES,
  MAX_CHANGES_PER_ENTRY,
  sanitizeChanges,
  buildEntry,
  appendEntry,
  newestFirst,
};
