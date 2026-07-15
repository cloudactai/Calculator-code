import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockDispatch = jest.fn(() => Promise.resolve());

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));
jest.mock("../../config", () => ({ CALCULATOR_API: "https://intake.test" }));
jest.mock("../../utils/Apis/matters/saveMatterInformation/saveMattersActions", () => ({
  saveMatter: (payload) => ({ type: "SAVE_MATTER", payload }),
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

test("shows the completion action when the intake service marks the intake complete", async () => {
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

test("sends only the current AI changes in explicit merge mode", async () => {
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
    type: "SAVE_MATTER",
    payload: {
      matter_id: "TEST-2",
      save_mode: "merge",
      data: {
        Background: {
          client: { name: "Sarah Mitchell", phone: "416-555-0101" },
        },
      },
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
    type: "SAVE_MATTER",
    payload: {
      matter_id: "TEST-2",
      save_mode: "merge",
      data: {
        EmploymentDetails: {
          client: {
            employmentStatus: "employed",
            employerName: "New Employer",
          },
        },
      },
    },
  });
  expect(mockDispatch.mock.calls[1][0].payload.data.Background).toBeUndefined();
  expect(screen.getByText(/Saved: Background · Employment/i)).toBeInTheDocument();
});
