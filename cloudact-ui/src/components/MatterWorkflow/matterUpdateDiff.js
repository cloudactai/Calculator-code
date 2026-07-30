import {
  SECTION_LABELS,
  normalizeStoredIntakeData,
} from "./matterIntakeContext";

/**
 * Real before/after comparison of two matter snapshots read from the database.
 *
 * The update agent states in prose what it changed, but prose is a claim. The
 * "changed from X to Y" line the lawyer sees is built here instead, from the
 * snapshot that was on file before the patch and the snapshot the write endpoint
 * read back after it. Both sides go through normalizeStoredIntakeData first, so
 * database-only metadata (row ids, asset_type discriminators) and blank form
 * placeholders never show up as changes.
 */

// Fields that identify a row to a human, best first. Used to label array items
// so a change reads "Assets › Lands › 12 King St › …" rather than "… › #2".
const ITEM_LABEL_KEYS = [
  "childName",
  "name",
  "address_of_property",
  "description_bassp",
  "description_ghiav",
  "firm_name",
  "policy_no",
  "account_number",
  "details_op",
  "details_moty",
  "insurance_type",
  "item",
  "type",
  "category",
  "details",
  "role",
];

const NOT_SET = "(not set)";

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** "market_value" / "dateOfMarriage" → "Market value" / "Date of marriage". */
function prettyKey(key) {
  const spaced = String(key)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!spaced) return String(key);
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function itemLabel(item, index) {
  if (isObject(item)) {
    for (const key of ITEM_LABEL_KEYS) {
      const value = item[key];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number") return String(value);
    }
  }
  return `#${index + 1}`;
}

/**
 * Key array items by what they describe rather than by position, so a reordered
 * or newly inserted row does not read as every following row having changed.
 * Genuinely identical labels fall back to their order within that label.
 */
function keyItems(list) {
  const keyed = new Map();
  const seen = new Map();
  (Array.isArray(list) ? list : []).forEach((item, index) => {
    const label = itemLabel(item, index);
    const count = (seen.get(label) || 0) + 1;
    seen.set(label, count);
    keyed.set(count === 1 ? label : `${label} (${count})`, item);
  });
  return keyed;
}

function formatValue(value) {
  if (value === undefined || value === null) return NOT_SET;
  if (typeof value === "string") return value.trim() || NOT_SET;
  if (isObject(value) || Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

function walk(before, after, trail, out) {
  if (before === undefined && after === undefined) return;

  const bothArrays = Array.isArray(before) || Array.isArray(after);
  const bothObjects = isObject(before) || isObject(after);

  if (bothArrays && !isObject(before) && !isObject(after)) {
    const beforeItems = keyItems(before);
    const afterItems = keyItems(after);
    for (const key of new Set([...beforeItems.keys(), ...afterItems.keys()])) {
      walk(beforeItems.get(key), afterItems.get(key), [...trail, key], out);
    }
    return;
  }

  if (bothObjects && !bothArrays) {
    const keys = new Set([
      ...Object.keys(isObject(before) ? before : {}),
      ...Object.keys(isObject(after) ? after : {}),
    ]);
    for (const key of keys) {
      walk(
        isObject(before) ? before[key] : undefined,
        isObject(after) ? after[key] : undefined,
        [...trail, prettyKey(key)],
        out
      );
    }
    return;
  }

  // Leaf, or a shape change between a value and a structure — either way the
  // honest thing to show is the formatted old value against the new one.
  const from = formatValue(before);
  const to = formatValue(after);
  if (from !== to) out.push({ label: trail.join(" › "), from, to });
}

/**
 * @param {object|null} beforeMatter snapshot as loaded before the patch
 * @param {object|null} afterMatter  snapshot the write endpoint read back
 * @returns {{ label: string, from: string, to: string }[]} one entry per value
 *          that actually changed in the database
 */
export function diffMatterSnapshots(beforeMatter, afterMatter) {
  const before = normalizeStoredIntakeData(beforeMatter || {});
  const after = normalizeStoredIntakeData(afterMatter || {});
  const changes = [];
  for (const section of new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ])) {
    walk(before[section], after[section], [SECTION_LABELS[section] || section], changes);
  }
  return changes;
}

export { NOT_SET };
