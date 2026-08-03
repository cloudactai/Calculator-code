/*
 * Matter lookup by URL parameter.
 *
 * Every matter-scoped route addresses its matter by the user-facing
 * matterNumber (`/single-matter/:id`, `/matters/:matterNumber/...`), which is
 * free text the user types at matter creation and is unique per user.
 *
 * The previous implementation resolved the parameter with a single findFirst
 * over `OR: [{ matterNumber }, { id }]`. When the matter number was numeric —
 * "3", "1001", "2024" — that matched two unrelated rows: the matter whose
 * matterNumber is "3" and the matter whose primary key is 3. With no orderBy,
 * the database was free to return either, so a request for one matter could
 * silently resolve to a different one and prefill its forms from the wrong
 * client's records.
 *
 * The lookup is now sequential: the unique (userId, matterNumber) key decides
 * the matter, and the numeric id is consulted only when no matter carries that
 * number. Legacy links that pass a database id still resolve; a real matter
 * number can never lose to one.
 */

async function findMatterForUser(db, userId, matterParam) {
  if (userId == null || matterParam == null || matterParam === "") return null;
  const byNumber = await db.matter.findUnique({
    where: { userId_matterNumber: { userId, matterNumber: String(matterParam) } },
  });
  if (byNumber) return byNumber;
  const asNumber = Number(matterParam);
  if (!Number.isInteger(asNumber) || asNumber <= 0) return null;
  // Scoped by userId so the fallback can never reach another user's matter.
  return db.matter.findFirst({ where: { userId, id: asNumber } });
}

module.exports = { findMatterForUser };
