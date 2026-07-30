import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));
jest.mock("../../config", () => ({ CALCULATOR_API: "https://update.test" }));
jest.mock("../../utils/Apis/matters/saveMatterInformation/saveMattersActions", () => ({
  patchMatterIntake: (payload) => ({ type: "PATCH_MATTER_INTAKE", payload }),
}));

import UpdateInformationChatPanel from "./UpdateInformationChatPanel";

const land = (today) => ({
  id: 7,
  asset_type: "lands",
  address_of_property: "12 King St",
  market_value: {
    client: { on_date_of_marriage: "", on_valuation_date: "", today },
    opposing_party: { on_date_of_marriage: "", on_valuation_date: "", today: "" },
  },
});

const snapshotWith = (today) => ({
  matter_number: "TEST-1",
  client_id: "Lorelai Phinnemore",
  background: [{ id: 1, role: "Client", name: "Lorelai Phinnemore" }],
  assets: { lands: [land(today)] },
});

beforeEach(() => {
  mockDispatch.mockReset();
  mockDispatch.mockResolvedValue({ saved: true, matter: snapshotWith("500000") });
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

function mockReply({ reply, saved_sections = [] }) {
  global.fetch.mockResolvedValueOnce({
    json: async () => ({ reply, messages: [], saved_sections }),
  });
}

/** Render the panel and wait for the agent's opening question. */
async function renderOpened(props = {}) {
  mockReply({ reply: "What would you like to change?" });
  const view = render(
    <UpdateInformationChatPanel
      matterData={snapshotWith("500000")}
      matterId="TEST-1"
      {...props}
    />
  );
  await screen.findByText("What would you like to change?");
  return view;
}

/** Type a message and send it. */
function sendMessage(text) {
  const textbox = screen.getByRole("textbox");
  fireEvent.change(textbox, { target: { value: text } });
  fireEvent.keyDown(textbox, { key: "Enter", code: "Enter" });
}

test("opens by asking what the user wants to change, without showing the primer", async () => {
  mockReply({ reply: "What would you like to change?" });

  render(
    <UpdateInformationChatPanel matterData={snapshotWith("500000")} matterId="TEST-1" />
  );

  expect(await screen.findByText("What would you like to change?")).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);

  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe("https://update.test/update-chat");

  // The snapshot goes to the agent but never into the visible transcript.
  const primer = JSON.parse(options.body).messages[0].content;
  expect(primer).toContain("12 King St");
  expect(primer).toContain("Ask me what I want to change");
  expect(screen.queryByText(/12 King St/)).not.toBeInTheDocument();

  // Nothing has been written yet.
  expect(mockDispatch).not.toHaveBeenCalled();
});

test("saves the change and reports the real before/after values from the database", async () => {
  const onSaved = jest.fn();
  const onChangeApplied = jest.fn();
  await renderOpened({ onSaved, onChangeApplied });

  mockReply({
    reply: "Updated **the house valuation** from **500000** to **650000**.",
    saved_sections: [
      {
        section: "Assets",
        data: {
          lands: [
            {
              address_of_property: "12 King St",
              market_value: { client: { today: "650000" } },
            },
          ],
        },
      },
    ],
  });
  mockDispatch.mockResolvedValueOnce({ saved: true, matter: snapshotWith("650000") });

  sendMessage("Change the valuation of the house to 650000");

  // The change reaches the database through the AI-only patch endpoint.
  await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
  expect(mockDispatch.mock.calls[0][0]).toEqual({
    type: "PATCH_MATTER_INTAKE",
    payload: {
      matter_id: "TEST-1",
      patches: [
        {
          section: "Assets",
          data: {
            lands: [
              {
                address_of_property: "12 King St",
                market_value: { client: { today: "650000" } },
              },
            ],
          },
        },
      ],
    },
  });

  // The receipt is computed from the snapshot the database read back.
  expect(
    await screen.findByText("Assets › Lands › 12 King St › Market value › Client › Today")
  ).toBeInTheDocument();
  // Scoped to the receipt: these values come from the database read-back, not
  // from the assistant's prose (which also mentions both numbers).
  expect(
    screen.getByText("500000", { selector: ".mw-change-receipt__from" })
  ).toBeInTheDocument();
  expect(
    screen.getByText("650000", { selector: ".mw-change-receipt__to" })
  ).toBeInTheDocument();
  expect(screen.getByText(/Saved to the database: 1 value changed/i)).toBeInTheDocument();

  expect(onSaved).toHaveBeenCalledWith(snapshotWith("650000"));
  expect(onChangeApplied).toHaveBeenCalledTimes(1);
});

test("a reply with no change never writes to the database", async () => {
  await renderOpened();

  mockReply({ reply: "The client's phone number on file is 226-559-2324." });
  sendMessage("What phone number is on file?");

  await screen.findByText("The client's phone number on file is 226-559-2324.");
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(screen.queryByText(/Saved to the database/i)).not.toBeInTheDocument();
});

test("says nothing changed when the record already held the value", async () => {
  await renderOpened();

  mockReply({
    reply: "Updated **the house valuation** to **500000**.",
    saved_sections: [{ section: "Assets", data: { lands: [{ address_of_property: "12 King St" }] } }],
  });
  // The write succeeds but the stored values come back identical.
  mockDispatch.mockResolvedValueOnce({ saved: true, matter: snapshotWith("500000") });

  sendMessage("Set the valuation to 500000");

  expect(
    await screen.findByText(/No stored value changed — the record already held that value/i)
  ).toBeInTheDocument();
  expect(screen.queryByText(/Saved to the database:/i)).not.toBeInTheDocument();
});

test("a rejected write is reported as not saved", async () => {
  await renderOpened();

  mockReply({
    reply: "Updated **the house valuation** from **500000** to **650000**.",
    saved_sections: [{ section: "Assets", data: { lands: [{ address_of_property: "12 King St" }] } }],
  });
  mockDispatch.mockRejectedValueOnce(new Error("rejected"));

  sendMessage("Change the valuation to 650000");

  expect(
    await screen.findByText(/That change was not saved — the database rejected the update/i)
  ).toBeInTheDocument();
  expect(screen.queryByText(/Saved to the database:/i)).not.toBeInTheDocument();
});

test("an empty matter explains that there is nothing to update yet", async () => {
  const onBack = jest.fn();
  render(
    <UpdateInformationChatPanel
      matterData={{ matter_number: "TEST-9", client_id: "" }}
      matterId="TEST-9"
      onBack={onBack}
    />
  );

  expect(await screen.findByText(/Nothing is saved on this matter yet/i)).toBeInTheDocument();
  // No conversation is started against an empty record.
  expect(global.fetch).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Back to Tasks" }));
  expect(onBack).toHaveBeenCalledTimes(1);
});
