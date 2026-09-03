import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("../../config", () => ({ CALCULATOR_API: "https://agreement.test" }));

jest.mock("../../services/agreementsService", () => ({
  agreementsService: {
    getAgreement: jest.fn(),
    saveAgreementDraft: jest.fn(() => Promise.resolve({})),
    resetAgreementChat: jest.fn(() => Promise.resolve({})),
    saveAgreementPdf: jest.fn(() => Promise.resolve({})),
    downloadAgreementPdf: jest.fn(),
  },
}));

jest.mock("./agreementResolver", () => {
  const actual = jest.requireActual("./agreementResolver");
  return {
    buildAgreementData: actual.buildAgreementData,
    agreementOutstandingFields: actual.agreementOutstandingFields,
    fetchAgreementCalcReports: jest.fn(() =>
      Promise.resolve({ childSupportReport: null, spousalSupportReport: null })
    ),
  };
});

import { agreementsService } from "../../services/agreementsService";
import { fetchAgreementCalcReports } from "./agreementResolver";
import AgreementChatPanel from "./AgreementChatPanel";

const matterData = {
  matter_number: "TEST-1",
  client_id: "Alex Doe",
  background: [
    { role: "Client", name: "Alex Doe", address: "565 Kanata Avenue" },
    { role: "Opposing Party", name: "Jane Doe", address: "250 Front St W" },
  ],
  relationship: [{ dateOfMarriage: "2000-06-30", placeOfMarriage: "Toronto", dateOfSeparation: "2025-06-30" }],
  children: [{ childName: "Mike Doe", dateOfBirth: "2010-06-30" }],
  assets: {},
  debts_liabilities: [],
};

beforeEach(() => {
  // react-scripts' Jest preset sets resetMocks: true, which calls
  // mockReset() on every jest.fn() before each test — including ones created
  // inside a jest.mock() factory above. That wipes any implementation given
  // inline in the factory, so every mock used here has its implementation
  // re-established per test, the same pattern UpdateInformationChatPanel's
  // own tests use.
  agreementsService.getAgreement.mockReset().mockResolvedValue({ answers: {}, transcript: [], hasPdf: false });
  agreementsService.saveAgreementDraft.mockReset().mockResolvedValue({});
  agreementsService.resetAgreementChat.mockReset().mockResolvedValue({});
  agreementsService.saveAgreementPdf.mockReset().mockResolvedValue({});
  agreementsService.downloadAgreementPdf.mockReset();
  fetchAgreementCalcReports
    .mockReset()
    .mockResolvedValue({ childSupportReport: null, spousalSupportReport: null });
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

function mockChatReply({ reply, saved_sections = [] }) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ reply, messages: [], saved_sections }),
  });
}

async function renderOpened(props = {}) {
  mockChatReply({ reply: "What would you like to cover first?" });
  render(
    <AgreementChatPanel
      matterData={matterData}
      matterId="TEST-1"
      agreementType="separation_agreement"
      onBack={() => {}}
      {...props}
    />
  );
  await screen.findByText("What would you like to cover first?");
}

describe("AgreementChatPanel", () => {
  it("loads the saved agreement and opens with a fresh primer", async () => {
    await renderOpened();
    expect(agreementsService.getAgreement).toHaveBeenCalledWith("TEST-1", "separation_agreement");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://agreement.test/agreement-chat",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("shows a prior transcript as history above the live conversation", async () => {
    agreementsService.getAgreement.mockResolvedValue({
      answers: { DecisionMaking: { responsibility: "joint" } },
      transcript: [
        { role: "user", text: "Let's cover decision making." },
        { role: "assistant", text: "Got it, saved as joint." },
      ],
      hasPdf: false,
    });
    await renderOpened();
    expect(screen.getByText("Let's cover decision making.")).toBeInTheDocument();
    expect(screen.getByText("Got it, saved as joint.")).toBeInTheDocument();
  });

  it("merges a saved_sections patch into the live document preview", async () => {
    await renderOpened();

    mockChatReply({
      reply: "Saved — decision-making is joint.",
      saved_sections: [{ section: "DecisionMaking", data: { responsibility: "joint decision-making" } }],
    });

    fireEvent.change(screen.getByPlaceholderText("Answer the assistant's question…"), {
      target: { value: "It's joint decision-making." },
    });
    fireEvent.keyDown(screen.getByPlaceholderText("Answer the assistant's question…"), {
      key: "Enter",
      shiftKey: false,
    });

    await screen.findByText("Saved — decision-making is joint.");
    await waitFor(() =>
      expect(screen.getAllByText(/joint decision-making/).length).toBeGreaterThan(0)
    );
    expect(agreementsService.saveAgreementDraft).toHaveBeenCalled();
  });

  it("Reset Chat clears the transcript and re-primes, without touching a generated PDF flag", async () => {
    agreementsService.getAgreement.mockResolvedValue({
      answers: {},
      transcript: [{ role: "assistant", text: "Old opening question." }],
      hasPdf: true,
    });
    await renderOpened();
    expect(screen.getByText("Old opening question.")).toBeInTheDocument();

    mockChatReply({ reply: "Fresh start — what would you like to cover?" });
    fireEvent.click(screen.getByTitle(/Reset chat/));

    await waitFor(() => expect(agreementsService.resetAgreementChat).toHaveBeenCalledWith("TEST-1", "separation_agreement"));
    await screen.findByText("Fresh start — what would you like to cover?");
    expect(screen.queryByText("Old opening question.")).not.toBeInTheDocument();
    // The generated-PDF flag is server state cleared only by the reset route
    // itself (which never touches pdfBytes) — the client doesn't fabricate
    // clearing it locally.
    expect(screen.getByText("Download PDF")).toBeInTheDocument();
  });
});
