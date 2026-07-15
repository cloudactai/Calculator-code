import {
  buildStoredMatterContextMessage,
  normalizeStoredIntakeData,
} from "./matterIntakeContext";

const savedMatter = {
  matter_number: "CA-2026-00007",
  client_id: "Lorelai Phinnemore",
  valuation_date: "2026-06-30",
  financial_year_income_benefits: "2026",
  financial_year_expenses: "2026",
  background: [
    {
      id: 1,
      role: "Client",
      province: "Ontario",
      name: "Lorelai Phinnemore",
      postalCode: "N2L 2R7",
      dateOfBirth: "",
      phone: "2265592324",
      address: "168 Westcourt Pl",
      municipality: "Waterloo",
      representedBy: "Self",
    },
    {
      id: 2,
      role: "Opposing Party",
      name: "Jordan Phinnemore",
    },
  ],
  relationship: [{ id: 1, dateOfMarriage: "2010-06-19" }],
  children: [{ id: 1, childName: "Emma Phinnemore", age: "12" }],
  income_benefits: [
    {
      id: 1,
      role: "Client",
      incomeBenefit: "income",
      financialYear: "2026",
      type: "Commissions, tips and bonuses",
      monthlyAmount: "4000",
      yearlyAmount: "48000",
    },
    {
      id: 2,
      role: "Client",
      incomeBenefit: "benefit",
      financialYear: "2026",
      type: "Commissions, tips and bonuses",
      monthlyAmount: "1000",
      yearlyAmount: "12000",
    },
  ],
  employment: [{ id: 1, role: "Client", employmentStatus: "employed" }],
  expenses: {
    client: {
      expenses: [
        { id: 1, role: "client", type: "Rent", monthlyAmount: "2400" },
      ],
      specialChildExpenses: [],
      expensesTotals: { totalMonthly: 2400 },
    },
    opposingParty: { expenses: [], specialChildExpenses: [] },
  },
  assets: {
    lands: [
      {
        id: 1,
        asset_type: "lands",
        address_of_property: "25 Cedar Ridge Drive",
      },
    ],
  },
  debts_liabilities: [
    { id: 1, category: "Line of credits", details: "RBC LOC" },
  ],
  court_info: [
    {
      id: 1,
      court_name: "Ontario Superior Court of Justice",
      file_number: "FC-26-00123",
      address: "85 Frederick Street",
    },
  ],
  other_persons: [{ id: 1, live_alone: "no", number_of_children: "1" }],
};

test("normalizes every saved database section for the intake agent", () => {
  const sections = normalizeStoredIntakeData(savedMatter);

  expect(Object.keys(sections)).toEqual([
    "Background",
    "Relationship",
    "Children",
    "IncomeAndBenefits",
    "EmploymentDetails",
    "Expenses",
    "Assets",
    "DebtsAndLiabilities",
    "Court",
    "OtherPersonsInHousehold",
  ]);
  expect(sections.Background.client).toMatchObject({
    name: "Lorelai Phinnemore",
    address: "168 Westcourt Pl",
    phone: "2265592324",
  });
  expect(sections.Background.client).not.toHaveProperty("id");
  expect(sections.Background.client).not.toHaveProperty("dateOfBirth");
  expect(sections.IncomeAndBenefits).toEqual({
    financialYear: "2026",
    client: {
      income: [
        {
          role: "Client",
          type: "Commissions, tips and bonuses",
          monthlyAmount: "4000",
          yearlyAmount: "48000",
        },
      ],
      benefit: [
        {
          role: "Client",
          type: "Commissions, tips and bonuses",
          monthlyAmount: "1000",
          yearlyAmount: "12000",
        },
      ],
    },
  });
  expect(sections.Court).toMatchObject({
    name: "Ontario Superior Court of Justice",
    fileNumber: "FC-26-00123",
  });
  expect(sections.Court).not.toHaveProperty("court_name");
  expect(sections.Expenses.client).not.toHaveProperty("expensesTotals");
});

test("context marks saved values as authoritative and corrections as patches", () => {
  const message = buildStoredMatterContextMessage(savedMatter);

  expect(message).toContain("authoritative database snapshot");
  expect(message).toContain("Do not ask for a value that is already populated");
  expect(message).toContain("Lorelai Phinnemore");
  expect(message).toContain("168 Westcourt Pl");
  expect(message).toContain("Commissions, tips and bonuses");
  expect(message).toContain('"monthlyAmount": "4000"');
  expect(message).not.toContain('"dateOfBirth": ""');
});
