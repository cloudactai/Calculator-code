/**
 * Manual matter intake routes to the 5-step accordion page (/5-steps).
 * (The earlier per-section modal view was replaced by the 5-step design.)
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";

jest.mock("../../components/LayoutComponents/Layout", () => ({ children }) => (
  <div>{children}</div>
));
jest.mock("../../components/MatterWorkflow/MatterIntakeChatPanel", () => () => <div />);
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

import { fetchRequest } from "../../utils/fetchRequest";
import store from "../../store";
import SingleMatter from "./SingleMatter";

beforeEach(() => {
  localStorage.clear();
  fetchRequest.mockResolvedValue({ data: { data: { body: [] } } });
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
