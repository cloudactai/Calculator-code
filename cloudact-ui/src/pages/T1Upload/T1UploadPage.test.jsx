import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockDispatch = jest.fn(() => Promise.resolve({ saved: true }));

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) =>
    selector({
      userProfileInfo: { response: { username: "Test User" } },
      getAllMatters: {
        response: {
          code: 200,
          status: "success",
          body: [
            { matterNumber: "CA-2026-00001", client_id: "Alex Smith" },
            { matterNumber: "CA-2026-00002", client_id: "Jordan Lee" },
          ],
        },
      },
    }),
}));
jest.mock("../../config", () => ({ CALCULATOR_API: "https://intake.test" }));
jest.mock("../../components/LayoutComponents/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock("../../utils/Apis/matters/getMatters/getMattersActions", () => ({
  getAllMatters: () => ({ type: "GET_ALL_MATTERS" }),
}));
jest.mock("../../utils/Apis/matters/saveMatterInformation/saveMattersActions", () => ({
  patchMatterIntake: (payload) => ({ type: "PATCH_MATTER_INTAKE", payload }),
}));

// Navigation state carries the matter number when launched from a matter task.
let mockLocationState = null;
jest.mock("react-router-dom", () => ({
  useLocation: () => ({ state: mockLocationState }),
  useHistory: () => ({ push: jest.fn(), goBack: jest.fn() }),
}));

import T1UploadPage from "./T1UploadPage";

const EXTRACTION = {
  is_t1: true,
  taxYear: "2025",
  taxpayer: {
    firstName: "Alex",
    lastName: "Smith",
    dateOfBirth: "1985-03-14",
    maritalStatus: "Separated",
    address: "12 Main St",
    poBox: "PO 45",
    city: "Toronto",
    province: "Ontario",
    postalCode: "M1M 1M1",
    phone: "",
    email: "",
    spouseName: "Jamie Smith",
  },
  incomeLines: [
    { line: "10100", label: "Employment income", amount: "85000.00" },
    { line: "12600", label: "Rental income", amount: "12000.00" },
  ],
  totalIncome: "86000.00",
  netIncome: "82000.00",
  taxableIncome: "80000.00",
};

function uploadPdf() {
  const input = document.querySelector('input[type="file"]');
  const file = new File(["%PDF-1.4"], "client-t1.pdf", { type: "application/pdf" });
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  mockLocationState = null;
  mockDispatch.mockClear();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ extracted: EXTRACTION }),
  });
});

afterEach(() => {
  delete global.fetch;
});

test("welcome message and upload box render on load", () => {
  render(<T1UploadPage />);
  expect(screen.getByText(/Upload the T1 below/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Upload/i })).toBeInTheDocument();
});

test("uploading a T1 extracts data into an editable review card", async () => {
  render(<T1UploadPage />);
  uploadPdf();

  // extraction posts the base64 file to /t1-extract
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe("https://intake.test/t1-extract");
  expect(JSON.parse(options.body).media_type).toBe("application/pdf");

  // editable review card with the extracted values
  expect(await screen.findByDisplayValue("Alex")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Employment income")).toBeInTheDocument();
  expect(screen.getByDisplayValue("85000.00")).toBeInTheDocument();
  expect(screen.getByText(/save this to a matter/i)).toBeInTheDocument();
});

test("saving sends Background and IncomeAndBenefits patches to the chosen matter", async () => {
  render(<T1UploadPage />);
  uploadPdf();
  await screen.findByDisplayValue("Alex");

  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "CA-2026-00001" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Save to matter/i }));

  expect(await screen.findByText(/Saved to matter CA-2026-00001/i)).toBeInTheDocument();

  const action = mockDispatch.mock.calls
    .map(([a]) => a)
    .find((a) => a && a.type === "PATCH_MATTER_INTAKE");
  expect(action).toBeDefined();
  expect(action.payload.matter_id).toBe("CA-2026-00001");
  const sections = action.payload.patches.map((p) => p.section);
  expect(sections).toEqual(["Background", "IncomeAndBenefits"]);

  const background = action.payload.patches[0].data.client;
  expect(background.name).toBe("Alex Smith");
  expect(background.address).toBe("12 Main St, Toronto");
  expect(background.poBox).toBe("PO 45");
  expect(background.maritalStatus).toBe("Separated");
  // Spouse from the T1 becomes the opposing party.
  expect(action.payload.patches[0].data.opposingParty.name).toBe("Jamie Smith");

  const income = action.payload.patches[1].data;
  expect(income.financialYear).toBe("2025");
  // Income lines are saved with the app's canonical type (matching the intake
  // dropdown + Form 13 adapter) and the CRA line number.
  expect(income.client.income[0]).toEqual({
    type: "Employment income (before deductions)",
    line: "10100",
    yearlyAmount: "85000.00",
    monthlyAmount: "7083.33",
  });
  // A line with no dedicated category (rental) maps to the recognised catch-all.
  expect(income.client.income[1]).toEqual({
    type: "Other sources of income",
    line: "12600",
    yearlyAmount: "12000.00",
    monthlyAmount: "1000.00",
  });
});

test("declining saves nothing", async () => {
  render(<T1UploadPage />);
  uploadPdf();
  await screen.findByDisplayValue("Alex");

  fireEvent.click(screen.getByRole("button", { name: /Don't save/i }));

  expect(await screen.findByText(/nothing was saved/i)).toBeInTheDocument();
  expect(mockDispatch).not.toHaveBeenCalledWith(
    expect.objectContaining({ type: "PATCH_MATTER_INTAKE" })
  );
});

test("launched from a matter: saves to that matter, no picker", async () => {
  mockLocationState = { matterNumber: "CA-2026-00002" };
  render(<T1UploadPage />);
  uploadPdf();
  await screen.findByDisplayValue("Alex");

  // The fixed matter is shown and the picker is hidden.
  expect(screen.getByText(/Matter CA-2026-00002/i)).toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Save to matter/i }));
  expect(await screen.findByText(/Saved to matter CA-2026-00002/i)).toBeInTheDocument();

  const action = mockDispatch.mock.calls
    .map(([a]) => a)
    .find((a) => a && a.type === "PATCH_MATTER_INTAKE");
  expect(action.payload.matter_id).toBe("CA-2026-00002");
});

test("extraction errors surface in the chat with a fresh upload box", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: "That file doesn't look like a T1 Income Tax and Benefit Return." }),
  });

  render(<T1UploadPage />);
  uploadPdf();

  expect(
    await screen.findByText(/doesn't look like a T1/i)
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Upload/i })).toBeInTheDocument();
});
