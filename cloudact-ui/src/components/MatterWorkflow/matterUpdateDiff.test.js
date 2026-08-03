import { diffMatterSnapshots } from "./matterUpdateDiff";

/**
 * Snapshots use the get_single_matter_data_all shape, which is also what the
 * AI patch endpoint reads back after a write.
 */
const matterWith = (overrides = {}) => ({
  matter_number: "TEST-1",
  client_id: "Lorelai Phinnemore",
  ...overrides,
});

const land = (address, today, extra = {}) => ({
  id: 7,
  asset_type: "lands",
  address_of_property: address,
  nature_and_type_of_ownership: "Jointly owned",
  market_value: {
    client: { on_date_of_marriage: "", on_valuation_date: "", today },
    opposing_party: { on_date_of_marriage: "", on_valuation_date: "", today: "" },
  },
  ...extra,
});

test("reports a house valuation change as one from/to line", () => {
  const before = matterWith({ assets: { lands: [land("12 King St", "500000")] } });
  const after = matterWith({ assets: { lands: [land("12 King St", "650000")] } });

  expect(diffMatterSnapshots(before, after)).toEqual([
    {
      label: "Assets › Lands › 12 King St › Market value › Client › Today",
      from: "500000",
      to: "650000",
    },
  ]);
});

test("reports nothing when the database record is unchanged", () => {
  const snapshot = matterWith({
    assets: { lands: [land("12 King St", "500000")] },
    background: [{ id: 1, role: "Client", name: "Lorelai Phinnemore" }],
  });

  expect(diffMatterSnapshots(snapshot, JSON.parse(JSON.stringify(snapshot)))).toEqual([]);
});

test("ignores database-only metadata so row ids never read as changes", () => {
  const before = matterWith({
    background: [{ id: 1, role: "Client", name: "Lorelai Phinnemore", phone: "2265592324" }],
  });
  const after = matterWith({
    background: [{ id: 99, role: "Client", name: "Lorelai Phinnemore", phone: "4165550101" }],
  });

  expect(diffMatterSnapshots(before, after)).toEqual([
    {
      label: "Background › Client › Phone",
      from: "2265592324",
      to: "4165550101",
    },
  ]);
});

test("a value that was never stored reads as (not set)", () => {
  const before = matterWith({
    background: [{ id: 1, role: "Client", name: "Lorelai Phinnemore", email: "" }],
  });
  const after = matterWith({
    background: [
      { id: 1, role: "Client", name: "Lorelai Phinnemore", email: "lorelai@example.com" },
    ],
  });

  expect(diffMatterSnapshots(before, after)).toEqual([
    {
      label: "Background › Client › Email",
      from: "(not set)",
      to: "lorelai@example.com",
    },
  ]);
});

test("labels array rows by what they describe, not by position", () => {
  // A new child is inserted ahead of the child whose value actually changed.
  const before = matterWith({
    children: [{ id: 1, childName: "Rory", nowLivesWith: "Client" }],
  });
  const after = matterWith({
    children: [
      { id: 2, childName: "April", nowLivesWith: "Client" },
      { id: 1, childName: "Rory", nowLivesWith: "Opposing Party" },
    ],
  });

  expect(diffMatterSnapshots(before, after)).toEqual(
    expect.arrayContaining([
      {
        label: "Children › Rory › Now lives with",
        from: "Client",
        to: "Opposing Party",
      },
      {
        label: "Children › April › Child name",
        from: "(not set)",
        to: "April",
      },
    ])
  );
  // Rory's own name is unchanged, so it must not appear.
  expect(diffMatterSnapshots(before, after)).not.toContainEqual(
    expect.objectContaining({ label: "Children › Rory › Child name" })
  );
});

test("reports an income figure change against the matching income line", () => {
  const incomeRow = (yearlyAmount) => ({
    id: 3,
    role: "Client",
    incomeBenefit: "income",
    type: "Employment income",
    yearlyAmount,
    monthlyAmount: "",
  });
  const before = matterWith({ income_benefits: [incomeRow("85000")] });
  const after = matterWith({ income_benefits: [incomeRow("92000")] });

  expect(diffMatterSnapshots(before, after)).toEqual([
    {
      label: "Income & benefits › Client › Income › Employment income › Yearly amount",
      from: "85000",
      to: "92000",
    },
  ]);
});

test("reports matter-header fields the intake sections own", () => {
  const before = matterWith({
    assets: { lands: [land("12 King St", "500000")] },
    valuation_date: "2025-01-01",
  });
  const after = matterWith({
    assets: { lands: [land("12 King St", "500000")] },
    valuation_date: "2026-03-15",
  });

  expect(diffMatterSnapshots(before, after)).toEqual([
    {
      label: "Assets › Valuation date",
      from: "2025-01-01",
      to: "2026-03-15",
    },
  ]);
});

test("distinguishes two properties with different addresses", () => {
  const before = matterWith({
    assets: {
      lands: [land("12 King St", "500000"), land("9 Queen Ave", "300000")],
    },
  });
  const after = matterWith({
    assets: {
      lands: [land("12 King St", "500000"), land("9 Queen Ave", "410000")],
    },
  });

  expect(diffMatterSnapshots(before, after)).toEqual([
    {
      label: "Assets › Lands › 9 Queen Ave › Market value › Client › Today",
      from: "300000",
      to: "410000",
    },
  ]);
});

test("an empty or missing snapshot never invents changes", () => {
  expect(diffMatterSnapshots(null, null)).toEqual([]);
  expect(diffMatterSnapshots(matterWith(), matterWith())).toEqual([]);
});
