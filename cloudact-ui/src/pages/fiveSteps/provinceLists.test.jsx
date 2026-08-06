/**
 * The province-specific pick lists must follow the MATTER, not the signed-in
 * user. A BC matter opened by an Ontario login used to get Ontario's expense
 * and income dropdowns, which cannot render the values a BC matter holds.
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, act, screen } from "@testing-library/react";
import { Provider } from "react-redux";

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("../../utils/helpers", () => ({
  ...jest.requireActual("../../utils/helpers"),
  getUserSID: () => "1",
  // The firm is in Ontario throughout this file.
  getCurrentUserFromCookies: () => ({ province: "ON" }),
}));
jest.mock("../../utils/fetchRequest", () => ({ fetchRequest: jest.fn() }));

import { fetchRequest } from "../../utils/fetchRequest";
import store from "../../store";

import IncomeAndBenefitsSimple from "./IncomeAndBenefitsSimple";
import ExpensesSimple from "./ExpensesSimple";

// One saved row per party, so the forms actually render a type dropdown to
// inspect (an empty section renders no rows at all).
const savedExpenses = {
  client: { expenses: [{ id: 1, type: "", monthlyAmount: "", yearlyAmount: "" }], specialChildExpenses: [] },
  opposingParty: { expenses: [], specialChildExpenses: [] },
};
const savedIncome = [
  { id: 1, role: "Client", incomeBenefit: "income", type: "", yearlyAmount: "", monthlyAmount: "" },
];

beforeEach(() => {
  fetchRequest.mockImplementation((method, url) => {
    const body = String(url).includes("expenses")
      ? savedExpenses
      : String(url).includes("incomeBenefits")
      ? savedIncome
      : [];
    return Promise.resolve({ data: { data: { body } } });
  });
});

const noop = () => {};

const renderForm = async (Comp, matterData, extra = {}) => {
  await act(async () => {
    render(
      <Provider store={store}>
        <Comp
          matterId="1"
          onUpdateFormData={noop}
          matterData={matterData}
          {...extra}
        />
      </Provider>
    );
  });
};

test("a BC matter gets BC expense types under an Ontario login", async () => {
  await renderForm(ExpensesSimple, { province: "British Columbia" }, {
    activeTab: "Client",
    setActiveTab: noop,
  });

  expect(screen.getAllByText("Property taxes an strata fees").length).toBeGreaterThan(0);
  expect(screen.queryByText("Meals outside the home")).not.toBeInTheDocument();
});

test("an Ontario matter still gets the Ontario expense types", async () => {
  await renderForm(ExpensesSimple, { province: "Ontario" }, {
    activeTab: "Client",
    setActiveTab: noop,
  });

  expect(screen.getAllByText("Meals outside the home").length).toBeGreaterThan(0);
  expect(screen.queryByText("Property taxes an strata fees")).not.toBeInTheDocument();
});

test("income types follow the matter too, including via Background", async () => {
  await renderForm(
    IncomeAndBenefitsSimple,
    { background: [{ role: "Client", province: "British Columbia" }] },
    { activeTab: "Client", setActiveTab: noop }
  );

  expect(screen.getAllByText("Workers compensation benefits").length).toBeGreaterThan(0);
  expect(screen.queryByText("Commissions, tips and bonuses")).not.toBeInTheDocument();
});

test("a matter with no province of its own falls back to the user's", async () => {
  await renderForm(IncomeAndBenefitsSimple, {}, {
    activeTab: "Client",
    setActiveTab: noop,
  });

  expect(screen.getAllByText("Commissions, tips and bonuses").length).toBeGreaterThan(0);
  expect(screen.queryByText("Workers compensation benefits")).not.toBeInTheDocument();
});
