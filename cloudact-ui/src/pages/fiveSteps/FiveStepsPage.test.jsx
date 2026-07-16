/**
 * The manual intake page renders every section at once (the *Simple forms) and
 * must not crash on empty data; editing a field auto-saves that section.
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";

jest.mock("../../components/LayoutComponents/Layout", () => ({ children }) => (
  <div>{children}</div>
));
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
import toast from "react-hot-toast";
import store from "../../store";
import FiveStepsPage from "./FiveStepsPage";

beforeEach(() => {
  localStorage.clear();
  toast.success.mockClear();
  store.dispatch({ type: "SAVE_MATTERS_RESET" });
  fetchRequest.mockResolvedValue({ data: { data: { body: [] } } });
});

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/5-steps/TEST-1"]}>
        <Route path="/5-steps/:id" component={FiveStepsPage} />
        <Route path="/single-matter/:id" render={() => <div>TASK LIST</div>} />
      </MemoryRouter>
    </Provider>
  );
}

test("Back to Tasks returns to the matter task list", async () => {
  renderPage();

  fireEvent.click(await screen.findByRole("button", { name: "Back to Tasks" }));

  expect(await screen.findByText("TASK LIST")).toBeInTheDocument();
});

test("renders all sections (no crash) and auto-saves a section on edit", async () => {
  renderPage();

  // Every section mounts without crashing (titles appear in timeline + header).
  expect((await screen.findAllByText("Background information")).length).toBeGreaterThan(0);
  expect(screen.getAllByText("Court information").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Income and benefits").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Other persons in Household").length).toBeGreaterThan(0);

  // Editing a field auto-saves (posts update_matter) with no Save/Finish click.
  fetchRequest.mockClear();
  const nameInput = (await screen.findAllByPlaceholderText(/enter name/i))[0];
  fireEvent.input(nameInput, { target: { value: "Edited Name" } });

  await waitFor(
    () =>
      expect(
        fetchRequest.mock.calls.some(
          (c) => typeof c[1] === "string" && c[1].includes("update_matter")
        )
      ).toBe(true),
    { timeout: 3000 }
  );
});

test("ignores a stale AI save result when the manual intake opens", async () => {
  // AI intake and manual intake use different save actions. The AI result may
  // still be present in Redux when the user switches to the manual forms.
  store.dispatch({
    type: "SAVE_MATTERS_SUCCESS",
    payload: { matter_id: "TEST-1", source: "ai-intake" },
  });

  renderPage();

  expect(
    (await screen.findAllByText("Background information")).length
  ).toBeGreaterThan(0);
  expect(screen.queryByText("TASK LIST")).not.toBeInTheDocument();
  expect(toast.success).not.toHaveBeenCalled();
});
