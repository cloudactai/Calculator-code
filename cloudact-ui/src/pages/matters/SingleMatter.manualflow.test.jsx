/**
 * Smoke test for the restored manual matter-intake flow:
 *   Task list → "Manual" → editable Profile Summary → open a HYDRATED section form.
 *
 * The backend is mocked: fetchRequest returns a Background record with a Client
 * and an Opposing Party, and getUserSID is stubbed (no auth cookie in jsdom).
 * This verifies the restored wiring end-to-end at the render level — the manual
 * view, the section modal, the hydrated *Simple form and its dropdowns.
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";

// No backend, no heavy page chrome.
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

// CRA's jest preset sets resetMocks:true, which wipes any implementation given
// inside the mock factory before each test — so (re)apply it here. Returns a
// Background record (Client + Opposing Party) so the hydrated form has values.
beforeEach(() => {
  fetchRequest.mockResolvedValue({
    data: {
      data: {
        body: [
          {
            role: "Client",
            province: "Ontario",
            name: "Jane Client",
            postalCode: "A1A1A1",
            phone: "5550001",
            address: "1 King St",
            email: "jane@example.com",
            representedBy: "Self",
            municipality: "Toronto",
          },
          {
            role: "Opposing Party",
            province: "Alberta",
            name: "John Opposing",
            postalCode: "B2B2B2",
            phone: "5550002",
            address: "2 Queen St",
            email: "john@example.com",
            representedBy: "Self",
            municipality: "Calgary",
          },
        ],
      },
    },
  });
});

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/single-matter/TEST-1"]}>
        <Route path="/single-matter/:id" component={SingleMatter} />
      </MemoryRouter>
    </Provider>
  );
}

test("manual intake restores the editable Profile Summary and opens a hydrated section form", async () => {
  renderPage();

  // Task list → start Matter Intake (first enabled "Start")
  const startButtons = await screen.findAllByRole("button", { name: /^start$/i });
  fireEvent.click(startButtons[0]);

  // Intake choice → choose Manual entry
  fireEvent.click(await screen.findByText(/open forms/i));

  // Manual view: editable Profile Summary with all sections
  expect(await screen.findByText(/profile summary/i)).toBeInTheDocument();
  expect(screen.getByText("Background Information")).toBeInTheDocument();
  expect(screen.getByText("Assets")).toBeInTheDocument();
  expect(screen.getByText("Other Persons in Household")).toBeInTheDocument();

  // Open the Background section → its modal opens, bound to the Background form
  fireEvent.click(screen.getAllByText(/view \/ edit/i)[0]);
  const dialog = await screen.findByRole("dialog");

  // Wait for hydration to replace the spinner (the "Opposing Party" tab only
  // exists once the form body renders), then assert the restored behaviour:
  await within(dialog).findAllByText("Client");
  // ...the form hydrated the saved values into its dropdowns...
  expect(within(dialog).getAllByText("Ontario").length).toBeGreaterThan(0);
  // ...the modal is titled for the section...
  expect(within(dialog).getByText("Background Information")).toBeInTheDocument();
  // ...and the per-section Save affordance is wired.
  const saveBtn = within(dialog).getByRole("button", { name: /save/i });
  expect(saveBtn).toBeInTheDocument();

  // Saving posts to the per-section update endpoint (save-as-you-go).
  fireEvent.click(saveBtn);
  await waitFor(() =>
    expect(
      fetchRequest.mock.calls.some(
        (c) => typeof c[1] === "string" && c[1].includes("update_matter")
      )
    ).toBe(true)
  );
});
