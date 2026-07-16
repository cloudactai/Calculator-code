/**
 * Manual matter intake routes to the 5-step accordion page (/5-steps).
 * (The earlier per-section modal view was replaced by the 5-step design.)
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";

const mockMatterIntakeProps = jest.fn();

jest.mock("../../components/LayoutComponents/Layout", () => ({ children }) => (
  <div>{children}</div>
));
jest.mock("../../components/MatterWorkflow/MatterIntakeChatPanel", () => (props) => {
  mockMatterIntakeProps(props);
  return <div>AI INTAKE CHAT</div>;
});
jest.mock("../../components/MatterWorkflow/ChildSupportChatPanel", () => () => <div />);
jest.mock("../../components/MatterWorkflow/SpousalSupportChatPanel", () => () => <div />);
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("../../utils/helpers", () => ({
  ...jest.requireActual("../../utils/helpers"),
  getUserSID: () => "1",
}));
jest.mock("../../utils/fetchRequest", () => ({ fetchRequest: jest.fn() }));
jest.mock("../../services/formsService", () => ({
  formsService: {
    listTaskStates: jest.fn(() => Promise.resolve([])),
    setTaskState: jest.fn(() => Promise.resolve({})),
  },
}));

import { fetchRequest } from "../../utils/fetchRequest";
import { formsService } from "../../services/formsService";
import store from "../../store";
import SingleMatter from "./SingleMatter";

beforeEach(() => {
  localStorage.clear();
  mockMatterIntakeProps.mockClear();
  fetchRequest.mockResolvedValue({ data: { data: { body: [] } } });
  formsService.listTaskStates.mockResolvedValue([]);
  formsService.setTaskState.mockResolvedValue({});
});

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/single-matter/TEST-1"]}>
        <Route path="/single-matter/:id" component={SingleMatter} />
        <Route path="/5-steps/:id" render={() => <div>FIVE STEPS PAGE</div>} />
      </MemoryRouter>
    </Provider>
  );
}

test("manual intake routes to the 5-step accordion page", async () => {
  renderPage();

  fireEvent.click((await screen.findAllByRole("button", { name: /^start$/i }))[0]);
  fireEvent.click(await screen.findByText(/open forms/i));

  expect(await screen.findByText("FIVE STEPS PAGE")).toBeInTheDocument();
});

test("AI intake opens with a fresh complete database snapshot", async () => {
  const databaseSnapshot = {
    matter_number: "TEST-1",
    client_id: "Lorelai Phinnemore",
    financial_year_income_benefits: "2026",
    background: [
      {
        id: 1,
        role: "Client",
        name: "Lorelai Phinnemore",
        address: "168 Westcourt Pl",
      },
    ],
    income_benefits: [
      {
        id: 1,
        role: "Client",
        incomeBenefit: "income",
        type: "Commissions, tips and bonuses",
        monthlyAmount: "4000",
        yearlyAmount: "48000",
      },
    ],
  };

  fetchRequest.mockImplementation((type, endpoint) => {
    if (endpoint.startsWith("get_single_matter_data_all/")) {
      return Promise.resolve({ data: { data: { body: databaseSnapshot } } });
    }
    if (endpoint.startsWith("get_single_matter/")) {
      return Promise.resolve({
        data: {
          data: {
            body: [{ client_id: "Lorelai Phinnemore", matterNumber: "TEST-1" }],
          },
        },
      });
    }
    return Promise.resolve({ data: { data: { body: [] } } });
  });

  renderPage();

  fireEvent.click((await screen.findAllByRole("button", { name: /^start$/i }))[0]);
  fireEvent.click(await screen.findByText("Start Chat"));

  expect(await screen.findByText("AI INTAKE CHAT")).toBeInTheDocument();
  expect(mockMatterIntakeProps).toHaveBeenLastCalledWith(
    expect.objectContaining({
      matterId: "TEST-1",
      matterData: databaseSnapshot,
    })
  );
  expect(fetchRequest).toHaveBeenCalledWith(
    "get",
    expect.stringContaining("get_single_matter_data_all/1/TEST-1")
  );
});
