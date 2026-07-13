/**
 * Smoke test: every *Simple section form must render without crashing on empty
 * data (they're all shown together in the intake accordion).
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("../../utils/helpers", () => ({
  ...jest.requireActual("../../utils/helpers"),
  getUserSID: () => "1",
  getCurrentUserFromCookies: () => ({ province: "ON" }),
}));
jest.mock("../../utils/fetchRequest", () => ({ fetchRequest: jest.fn() }));

import { fetchRequest } from "../../utils/fetchRequest";
import store from "../../store";

import BackgroundInformationSimple from "./BackgroundInformationSimple";
import CourtInformationSimple from "./CourtInformationSimple";
import ChildrenInformationSimple from "./ChildrenInformationSimple";
import RelationshipInformationSimple from "./RelationshipInformationSimple";
import EmploymentDetailsSimple from "./EmploymentDetailsSimple";
import IncomeAndBenefitsSimple from "./IncomeAndBenefitsSimple";
import ExpensesSimple from "./ExpensesSimple";
import AssetsSimple from "./AssetsSimple";
import DebtsAndLiabilitiesSimple from "./DebtsAndLiabilitiesSimple";
import OtherPersonsInHouseholdSimple from "./OtherPersonsInHouseholdSimple";

beforeEach(() => {
  fetchRequest.mockResolvedValue({ data: { data: { body: [] } } });
});

const noop = () => {};
const common = { matterId: "1", onUpdateFormData: noop, matterData: {} };

const FORMS = [
  ["BackgroundInformationSimple", BackgroundInformationSimple, { bgInfoActiveTab: "Client", setBgInfoActiveTab: noop }],
  ["CourtInformationSimple", CourtInformationSimple, {}],
  ["ChildrenInformationSimple", ChildrenInformationSimple, { activeTab: 0, setActiveTab: noop }],
  ["RelationshipInformationSimple", RelationshipInformationSimple, {}],
  ["EmploymentDetailsSimple", EmploymentDetailsSimple, { activeTab: "Client", setActiveTab: noop }],
  ["IncomeAndBenefitsSimple", IncomeAndBenefitsSimple, { activeTab: "Client", setActiveTab: noop }],
  ["ExpensesSimple", ExpensesSimple, { activeTab: "Client", setActiveTab: noop }],
  ["AssetsSimple", AssetsSimple, {}],
  ["DebtsAndLiabilitiesSimple", DebtsAndLiabilitiesSimple, {}],
  ["OtherPersonsInHouseholdSimple", OtherPersonsInHouseholdSimple, {}],
];

FORMS.forEach(([name, Comp, extra]) => {
  test(`${name} renders without crashing`, async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <Comp {...common} {...extra} />
          </MemoryRouter>
        </Provider>
      );
      await new Promise((r) => setTimeout(r, 50));
    });
  });
});
