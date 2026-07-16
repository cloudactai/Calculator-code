const test = require("node:test");
const assert = require("node:assert/strict");

const {
  mergeNonBlank,
  mergeRecordRows,
} = require("./matterPatchMerge");

test("deep merge retains saved values when an AI patch contains blanks", () => {
  const saved = {
    name: "Sarah Mitchell",
    phone: "416-555-0101",
    lawyer: { name: "Jane Advocate", phone: "416-555-0200" },
  };
  const patch = {
    name: "",
    phone: "416-555-9999",
    lawyer: { name: "", phone: "" },
  };

  assert.deepEqual(mergeNonBlank(saved, patch), {
    name: "Sarah Mitchell",
    phone: "416-555-9999",
    lawyer: { name: "Jane Advocate", phone: "416-555-0200" },
  });
});

test("zero and false remain valid patch values", () => {
  assert.deepEqual(
    mergeNonBlank({ amount: "100", active: true }, { amount: 0, active: false }),
    { amount: 0, active: false }
  );
});

test("a child patch updates its matching child without deleting siblings", () => {
  const saved = [
    { id: 1, childName: "Emma Mitchell", dateOfBirth: "2013-04-05", age: "12" },
    { id: 2, childName: "Liam Mitchell", dateOfBirth: "2016-08-14", age: "9" },
  ];
  const patch = [{ childName: "Emma Mitchell", dateOfBirth: "", age: "13" }];

  assert.deepEqual(
    mergeRecordRows(saved, patch, {
      identityGroups: [["childName", "dateOfBirth"], ["childName"], ["dateOfBirth"]],
    }),
    [
      { id: 1, childName: "Emma Mitchell", dateOfBirth: "2013-04-05", age: "13" },
      { id: 2, childName: "Liam Mitchell", dateOfBirth: "2016-08-14", age: "9" },
    ]
  );
});

test("a party patch preserves both parties and untouched client fields", () => {
  const saved = [
    { id: 1, role: "Client", name: "Sarah Mitchell", phone: "416-555-0101" },
    { id: 2, role: "Opposing Party", name: "David Mitchell", phone: "416-555-0102" },
  ];
  const patch = [
    { role: "Client", name: "", phone: "416-555-9999" },
    { role: "Opposing Party", name: "", phone: "" },
  ];

  assert.deepEqual(
    mergeRecordRows(saved, patch, { identityGroups: [["role"]] }),
    [
      { id: 1, role: "Client", name: "Sarah Mitchell", phone: "416-555-9999" },
      { id: 2, role: "Opposing Party", name: "David Mitchell", phone: "416-555-0102" },
    ]
  );
});

test("an income patch updates one line and preserves other income lines", () => {
  const saved = [
    { role: "Client", incomeBenefit: "income", type: "Employment", yearlyAmount: "95000" },
    { role: "Client", incomeBenefit: "income", type: "Rental", yearlyAmount: "12000" },
  ];
  const patch = [
    { role: "Client", incomeBenefit: "income", type: "Employment", yearlyAmount: "100000" },
  ];

  const merged = mergeRecordRows(saved, patch, {
    identityGroups: [["role", "incomeBenefit", "type"]],
  });
  assert.equal(merged.length, 2);
  assert.equal(merged[0].yearlyAmount, "100000");
  assert.equal(merged[1].yearlyAmount, "12000");
});

test("an expense patch updates one type without deleting another type", () => {
  const saved = [
    { role: "client", type: "Rent", monthlyAmount: "2400", yearlyAmount: "28800" },
    { role: "client", type: "Groceries", monthlyAmount: "900", yearlyAmount: "10800" },
  ];
  const patch = [
    { role: "client", type: "Rent", monthlyAmount: "2500", yearlyAmount: "" },
  ];

  assert.deepEqual(
    mergeRecordRows(saved, patch, { identityGroups: [["role", "type"]] }),
    [
      { role: "client", type: "Rent", monthlyAmount: "2500", yearlyAmount: "28800" },
      { role: "client", type: "Groceries", monthlyAmount: "900", yearlyAmount: "10800" },
    ]
  );
});

test("an asset patch deep-merges market values into the identified asset", () => {
  const saved = [
    {
      asset_type: "lands",
      address_of_property: "123 Maple Street",
      nature_and_type_of_ownership: "Jointly owned",
      market_value: {
        client: { on_date_of_marriage: "500000", on_valuation_date: "820000", today: "850000" },
      },
    },
  ];
  const patch = [
    {
      asset_type: "lands",
      address_of_property: "123 Maple Street",
      nature_and_type_of_ownership: "",
      market_value: {
        client: { on_date_of_marriage: "", on_valuation_date: "", today: "875000" },
      },
    },
  ];

  const merged = mergeRecordRows(saved, patch, {
    identityGroups: [["asset_type", "address_of_property"]],
    uniqueFallbackFields: ["asset_type"],
  });
  assert.equal(merged[0].nature_and_type_of_ownership, "Jointly owned");
  assert.deepEqual(merged[0].market_value.client, {
    on_date_of_marriage: "500000",
    on_valuation_date: "820000",
    today: "875000",
  });
});

test("a second asset of the same category appends when its identity differs", () => {
  const saved = [
    {
      id: 1,
      asset_type: "lands",
      address_of_property: "123 Maple Street",
      nature_and_type_of_ownership: "Jointly owned",
    },
  ];
  const patch = [
    {
      asset_type: "lands",
      address_of_property: "10 Lake Road",
      nature_and_type_of_ownership: "Sole ownership",
    },
  ];

  const merged = mergeRecordRows(saved, patch, {
    identityGroups: [["asset_type", "address_of_property"]],
    uniqueFallbackFields: ["asset_type"],
  });
  assert.equal(merged.length, 2);
  assert.equal(merged[0].address_of_property, "123 Maple Street");
  assert.equal(merged[1].address_of_property, "10 Lake Road");
});

test("a partial asset patch can target the only row in its category", () => {
  const saved = [
    {
      asset_type: "lands",
      address_of_property: "123 Maple Street",
      nature_and_type_of_ownership: "Jointly owned",
    },
  ];
  const patch = [
    {
      asset_type: "lands",
      address_of_property: "",
      nature_and_type_of_ownership: "Sole ownership",
    },
  ];

  const merged = mergeRecordRows(saved, patch, {
    identityGroups: [["asset_type", "address_of_property"]],
    uniqueFallbackFields: ["asset_type"],
  });
  assert.deepEqual(merged, [
    {
      asset_type: "lands",
      address_of_property: "123 Maple Street",
      nature_and_type_of_ownership: "Sole ownership",
    },
  ]);
});

test("new identified rows append and placeholder-only rows do not", () => {
  const saved = [{ category: "Mortgages", details: "Home mortgage", today: "100000" }];
  const patch = [
    { category: "Line of credits", details: "RBC LOC", today: "20000" },
    { category: "", details: "", today: "" },
  ];
  const merged = mergeRecordRows(saved, patch, {
    identityGroups: [["category", "details"], ["details"]],
    uniqueFallbackFields: ["category"],
  });

  assert.equal(merged.length, 2);
  assert.equal(merged[1].details, "RBC LOC");
});

test("a new debt in an existing category is not merged into another debt", () => {
  const saved = [
    { category: "Other loans", details: "Car loan", today: "15000" },
  ];
  const patch = [
    { category: "Other loans", details: "Personal loan", today: "5000" },
  ];
  const merged = mergeRecordRows(saved, patch, {
    identityGroups: [["category", "details"], ["details"]],
    uniqueFallbackFields: ["category"],
  });

  assert.equal(merged.length, 2);
  assert.equal(merged[0].details, "Car loan");
  assert.equal(merged[1].details, "Personal loan");
});

test("singleton sections patch the existing row instead of appending another", () => {
  const saved = [{ court_name: "Superior Court", file_number: "FC-1", address: "Old address" }];
  const patch = [{ court_name: "", file_number: "", address: "393 University Avenue" }];
  const merged = mergeRecordRows(saved, patch, { singleton: true });

  assert.deepEqual(merged, [
    {
      court_name: "Superior Court",
      file_number: "FC-1",
      address: "393 University Avenue",
    },
  ]);
});

test("an empty conversational row collection never deletes saved rows", () => {
  const saved = [{ id: 1, childName: "Emma Mitchell", age: "13" }];
  assert.deepEqual(mergeRecordRows(saved, [], {}), saved);
});

test("ambiguous partial identities are rejected instead of guessing", () => {
  assert.throws(
    () => mergeRecordRows(
      [
        { asset_type: "lands", address_of_property: "1 Main Street" },
        { asset_type: "lands", address_of_property: "2 Main Street" },
      ],
      [{ asset_type: "lands", market_value: { client: { today: "900000" } } }],
      { identityGroups: [["asset_type", "address_of_property"]], uniqueFallbackFields: ["asset_type"] }
    ),
    { code: "AMBIGUOUS_PATCH" }
  );
});
