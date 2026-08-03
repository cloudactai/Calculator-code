const test = require("node:test");
const assert = require("node:assert/strict");
const { findMatterForUser } = require("./matterLookup");

// Minimal stand-in for the Prisma client: findUnique honours the compound
// (userId, matterNumber) key, findFirst filters the same rows by userId/id.
function fakeDb(rows) {
  const calls = [];
  return {
    calls,
    matter: {
      findUnique: async ({ where }) => {
        calls.push("findUnique");
        const { userId, matterNumber } = where.userId_matterNumber;
        return rows.find((row) => row.userId === userId && row.matterNumber === matterNumber) || null;
      },
      findFirst: async ({ where }) => {
        calls.push("findFirst");
        return rows.find((row) => row.userId === where.userId && row.id === where.id) || null;
      },
    },
  };
}

// The regression this module exists for: a blank matter numbered "3" must not
// resolve to the older matter that happens to hold primary key 3, which is how
// a fresh matter's forms came back prefilled from an earlier client's records.
test("a numeric matter number never loses to another matter's primary key", async () => {
  const db = fakeDb([
    { id: 3, userId: "user-1", matterNumber: "SMITH-2025", clientName: "Older intake" },
    { id: 41, userId: "user-1", matterNumber: "3", clientName: "New blank matter" },
  ]);
  const matter = await findMatterForUser(db, "user-1", "3");
  assert.equal(matter.id, 41);
  assert.equal(matter.clientName, "New blank matter");
  // Resolved on the unique key alone; the id fallback is never consulted.
  assert.deepEqual(db.calls, ["findUnique"]);
});

test("legacy links that carry a database id still resolve", async () => {
  const db = fakeDb([{ id: 7, userId: "user-1", matterNumber: "SMITH-2025" }]);
  const matter = await findMatterForUser(db, "user-1", 7);
  assert.equal(matter.id, 7);
  assert.deepEqual(db.calls, ["findUnique", "findFirst"]);
});

test("the id fallback stays scoped to the requesting user", async () => {
  const db = fakeDb([{ id: 7, userId: "user-2", matterNumber: "OTHER-1" }]);
  assert.equal(await findMatterForUser(db, "user-1", 7), null);
});

test("non-numeric and missing parameters resolve by number or not at all", async () => {
  const db = fakeDb([{ id: 1, userId: "user-1", matterNumber: "SMITH-2025" }]);
  assert.equal((await findMatterForUser(db, "user-1", "SMITH-2025")).id, 1);
  assert.equal(await findMatterForUser(db, "user-1", "UNKNOWN-9"), null);
  assert.equal(await findMatterForUser(db, "user-1", ""), null);
  assert.equal(await findMatterForUser(db, "user-1", undefined), null);
  assert.equal(await findMatterForUser(db, "user-1", "0"), null);
  assert.equal(await findMatterForUser(db, "user-1", "-4"), null);
});
