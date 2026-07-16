import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockDispatch = jest.fn(() => Promise.resolve({ saved: true, completion: { complete: false, missing: [] } }));

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));
jest.mock("../../config", () => ({ CALCULATOR_API: "https://intake.test" }));
jest.mock("../../utils/Apis/matters/saveMatterInformation/saveMattersActions", () => ({
  patchMatterIntake: (payload) => ({ type: "PATCH_MATTER_INTAKE", payload }),
}));
jest.mock("../../utils/helpers", () => ({
  getAllUserInfo: () => ({}),
  getCurrentUserFromCookies: () => ({}),
  getCompanyInfo: () => ({}),
  getUserProvince: () => "Ontario",
}));

import MatterIntakeChatPanel from "./MatterIntakeChatPanel";

beforeEach(() => {
  mockDispatch.mockClear();
  global.fetch = jest.fn().mockResolvedValue({
    json: async () => ({
      reply: "All information has been captured and saved.",
      messages: [],
      saved_sections: [],
      intake_complete: true,
    }),
  });
});

afterEach(() => {
  delete global.fetch;
});

test("shows the completion action only when backend storage validation marks complete", async () => {
  mockDispatch.mockImplementationOnce(() => Promise.resolve({ saved: true, completion: { complete: true, missing: [] } }));
  const onComplete = jest.fn();
  const onBack = jest.fn();

  render(
    <MatterIntakeChatPanel
      matterData={null}
      matterId="TEST-1"
      onComplete={onComplete}
      onBack={onBack}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "Start intake" }));

  expect(
    await screen.findByText(/Intake complete and saved. Return to Tasks/i)
  ).toBeInTheDocument();
  expect(onComplete).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "Back to Tasks" }));
  expect(onBack).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "New conversation" }));
  await waitFor(() => {
    expect(
      screen.queryByText(/Intake complete and saved. Return to Tasks/i)
    ).not.toBeInTheDocument();
  });
});

test("sends ordered current AI patches to the dedicated endpoint", async () => {
  global.fetch
    .mockResolvedValueOnce({
      json: async () => ({
        reply: "Background saved.",
        messages: [{ role: "assistant", content: "Background saved." }],
        saved_sections: [
          {
            section: "Background",
            data: {
              client: { name: "Sarah Mitchell", phone: "416-555-0101" },
            },
          },
        ],
        intake_complete: false,
      }),
    })
    .mockResolvedValueOnce({
      json: async () => ({
        reply: "Employment saved.",
        messages: [{ role: "assistant", content: "Employment saved." }],
        saved_sections: [
          {
            section: "EmploymentDetails",
            data: {
              client: { employmentStatus: "employed", employerName: "New Employer" },
            },
          },
        ],
        intake_complete: false,
      }),
    });

  render(
    <MatterIntakeChatPanel matterData={null} matterId="TEST-2" />
  );

  fireEvent.click(screen.getByRole("button", { name: "Start intake" }));
  await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(1));

  expect(mockDispatch.mock.calls[0][0]).toEqual({
      type: "PATCH_MATTER_INTAKE",
      payload: {
        matter_id: "TEST-2",
        patches: [{ section: "Background", data: { client: { name: "Sarah Mitchell", phone: "416-555-0101" } } }],
    },
  });

  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "The client now works for New Employer." },
  });
  fireEvent.keyDown(screen.getByRole("textbox"), {
    key: "Enter",
    code: "Enter",
  });

  await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(2));
  expect(mockDispatch.mock.calls[1][0]).toEqual({
      type: "PATCH_MATTER_INTAKE",
      payload: {
        matter_id: "TEST-2",
        patches: [{ section: "EmploymentDetails", data: { client: { employmentStatus: "employed", employerName: "New Employer" } } }],
    },
  });
  expect(mockDispatch.mock.calls[1][0].payload.patches[0].section).toBe("EmploymentDetails");
  expect(screen.getByText(/Saved: Background · Employment/i)).toBeInTheDocument();
});

test("does not collapse repeated section tool calls", async () => {
  global.fetch.mockResolvedValueOnce({
    json: async () => ({
      reply: "Assets saved.", messages: [], intake_complete: false,
      saved_sections: [
        { section: "Assets", data: { lands: [{ address_of_property: "1 Main Street" }] } },
        { section: "Assets", data: { bank_accounts_savings_securities_pension: [{ account_number: "1234" }] } },
      ],
    }),
  });
  render(<MatterIntakeChatPanel matterData={null} matterId="TEST-4" />);
  fireEvent.click(screen.getByRole("button", { name: "Start intake" }));
  await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(1));
  expect(mockDispatch.mock.calls[0][0].payload.patches).toEqual([
    { section: "Assets", data: { lands: [{ address_of_property: "1 Main Street" }] } },
    { section: "Assets", data: { bank_accounts_savings_securities_pension: [{ account_number: "1234" }] } },
  ]);
});

test("starts with all manually saved database values and does not expose the primer", async () => {
  global.fetch.mockResolvedValueOnce({
    json: async () => ({
      reply: "What was the date of marriage?",
      messages: [],
      saved_sections: [],
      intake_complete: false,
    }),
  });

  render(
    <MatterIntakeChatPanel
      matterId="TEST-3"
      matterData={{
        matter_number: "TEST-3",
        client_id: "Lorelai Phinnemore",
        financial_year_income_benefits: "2026",
        background: [
          {
            id: 1,
            role: "Client",
            name: "Lorelai Phinnemore",
            address: "168 Westcourt Pl",
            phone: "2265592324",
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
      }}
    />
  );

  expect(await screen.findByText("What was the date of marriage?")).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);

  const request = JSON.parse(global.fetch.mock.calls[0][1].body);
  const primer = request.messages[0].content;
  expect(primer).toContain("Lorelai Phinnemore");
  expect(primer).toContain("168 Westcourt Pl");
  expect(primer).toContain('"monthlyAmount": "4000"');
  expect(primer).toContain("Do not ask for a value that is already populated");

  expect(screen.queryByText(/168 Westcourt Pl/)).not.toBeInTheDocument();
  expect(screen.getByText(/Saved: Background · Income & benefits/i)).toBeInTheDocument();
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "PATCH_MATTER_INTAKE",
    payload: { matter_id: "TEST-3", patches: [] },
  });
});
