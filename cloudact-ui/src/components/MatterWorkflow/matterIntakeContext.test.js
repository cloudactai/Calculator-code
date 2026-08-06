import {
  buildFormOptionLists,
  buildStoredMatterContextMessage,
  normalizeStoredIntakeData,
} from "./matterIntakeContext";
import {
  expenseDetails,
  expenseDetailsBC,
  incomeDetailsON,
} from "../../utils/matterData/categoryData";

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

test("option lists are the intake form's own dropdowns, per province", () => {
  const ontario = buildFormOptionLists("ON");

  // The whole expense dropdown travels with the primer — the agent's menu can
  // only be complete if every value is there.
  expect(ontario.expense).toEqual(expenseDetails.map((o) => o.value));
  expect(ontario.income).toEqual(incomeDetailsON.map((o) => o.value));
  expect(ontario.specialChildExpense).toContain("Extraordinary education expenses");
  expect(ontario.province).toContain("Ontario");
  expect(ontario.province).toContain("British Columbia");

  // Courts travel with their addresses so the agent can fill both.
  expect(ontario.court.length).toBeGreaterThan(50);
  expect(ontario.court[0]).toEqual(
    expect.objectContaining({ name: expect.any(String), address: expect.any(String) })
  );

  const bc = buildFormOptionLists("BC");
  expect(bc.expense).toEqual(expenseDetailsBC.map((o) => o.value));
  expect(bc.income).toContain("Workers compensation benefits");
  // A province with no courts on file gets none — never Ontario's by accident.
  expect(bc.court).toEqual([]);

  // An unknown or missing province falls back to the Ontario lists, exactly as
  // the manual forms do.
  expect(buildFormOptionLists(undefined).expense).toEqual(ontario.expense);
});

test("the primer carries the address book and the option lists", () => {
  const message = buildStoredMatterContextMessage(savedMatter, {
    province: "ON",
    lawyers: [
      { id: 3, name: "Dana Okafor", municipality: "Waterloo", phone: "" },
      { id: 4, name: "", municipality: "Toronto" },
    ],
  });

  expect(message).toContain("numbered menu");
  expect(message).toContain("Dana Okafor");
  expect(message).toContain("Meals outside the home");
  // A nameless row can't be offered as a choice, and blanks are dropped.
  expect(message).not.toContain("Toronto");
  expect(message).not.toContain('"phone": ""');
});
