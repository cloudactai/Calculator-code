const test = require("node:test");
const assert = require("node:assert");

const {
  MAX_ENTRIES,
  MAX_CHANGES_PER_ENTRY,
  sanitizeChanges,
  buildEntry,
  appendEntry,
  newestFirst,
} = require("./changeLog");

const AT = new Date("2026-07-30T18:14:00.000Z");

const change = (overrides = {}) => ({
  label: "Assets › Lands › 12 King St › Market value › Client › Today",
  from: "500000",
  to: "650000",
  ...overrides,
});

// ── sanitizing ────────────────────────────────────────────────────────────────

test("keeps a well-formed change verbatim", () => {
  assert.deepStrictEqual(sanitizeChanges([change()]), [change()]);
});

test("rejects payloads that are not a usable list of changes", () => {
  assert.strictEqual(sanitizeChanges([]), null);
  assert.strictEqual(sanitizeChanges(undefined), null);
  assert.strictEqual(sanitizeChanges("Assets changed"), null);
  assert.strictEqual(sanitizeChanges([null, 7, "text"]), null);
  // A change with no label identifies nothing.
  assert.strictEqual(sanitizeChanges([{ from: "1", to: "2" }]), null);
});

test("a value that was never set is recorded as an empty string, not dropped", () => {
  const entry = sanitizeChanges([change({ from: undefined, to: "416-555-0101" })]);
  assert.strictEqual(entry[0].from, "");
  assert.strictEqual(entry[0].to, "416-555-0101");
});

test("oversized text is clamped so one entry cannot bloat the column", () => {
  const [only] = sanitizeChanges([change({ to: "x".repeat(5000) })]);
  assert.strictEqual(only.to.length, 500);
});

test("a single save cannot record an unbounded number of changes", () => {
  const many = Array.from({ length: MAX_CHANGES_PER_ENTRY + 25 }, (_, i) =>
    change({ label: `Field ${i}` })
  );
  assert.strictEqual(sanitizeChanges(many).length, MAX_CHANGES_PER_ENTRY);
});

test("non-string values are coerced rather than stored raw", () => {
  const [only] = sanitizeChanges([{ label: "Children › Rory › Age", from: 15, to: 16 }]);
  assert.strictEqual(only.from, "15");
  assert.strictEqual(only.to, "16");
});

// ── entries ───────────────────────────────────────────────────────────────────

test("an entry records when it happened and what made it", () => {
  const entry = buildEntry({ changes: [change()], source: "ai-update", at: AT });
  assert.strictEqual(entry.at, "2026-07-30T18:14:00.000Z");
  assert.strictEqual(entry.source, "ai-update");
  assert.deepStrictEqual(entry.changes, [change()]);
});

test("an entry always attributes itself even when no source is given", () => {
  assert.strictEqual(buildEntry({ changes: [change()], at: AT }).source, "ai-update");
});

// ── appending ─────────────────────────────────────────────────────────────────

test("appends to an empty or missing log", () => {
  const entry = buildEntry({ changes: [change()], at: AT });
  assert.strictEqual(appendEntry(undefined, entry).length, 1);
  assert.strictEqual(appendEntry([], entry).length, 1);
  assert.strictEqual(appendEntry(null, entry)[0].id, 1);
});

test("appends newest-last and never rewrites history", () => {
  const first = buildEntry({ changes: [change({ to: "600000" })], at: AT });
  const second = buildEntry({ changes: [change({ from: "600000" })], at: AT });

  const log = appendEntry(appendEntry([], first), second);
  assert.strictEqual(log.length, 2);
  assert.strictEqual(log[0].changes[0].to, "600000");
  assert.strictEqual(log[1].changes[0].from, "600000");
  assert.deepStrictEqual(
    log.map((entry) => entry.id),
    [1, 2]
  );
});

test("the log is bounded — the oldest entries fall off the end", () => {
  let log = [];
  for (let i = 0; i < MAX_ENTRIES + 10; i += 1) {
    log = appendEntry(log, buildEntry({ changes: [change({ label: `Field ${i}` })], at: AT }));
  }
  assert.strictEqual(log.length, MAX_ENTRIES);
  // The first ten are gone; the newest is last.
  assert.strictEqual(log[0].changes[0].label, "Field 10");
  assert.strictEqual(log[log.length - 1].changes[0].label, `Field ${MAX_ENTRIES + 9}`);
});

test("a corrupt stored log does not break the next append", () => {
  const entry = buildEntry({ changes: [change()], at: AT });
  assert.strictEqual(appendEntry("not a log", entry).length, 1);
  assert.strictEqual(appendEntry([null, undefined], entry).length, 1);
});

test("display order is newest first without mutating the stored log", () => {
  const stored = appendEntry(
    appendEntry([], buildEntry({ changes: [change({ to: "600000" })], at: AT })),
    buildEntry({ changes: [change({ to: "650000" })], at: AT })
  );

  const shown = newestFirst(stored);
  assert.strictEqual(shown[0].changes[0].to, "650000");
  assert.strictEqual(stored[0].changes[0].to, "600000", "stored log must be untouched");
  assert.deepStrictEqual(newestFirst(undefined), []);
});
