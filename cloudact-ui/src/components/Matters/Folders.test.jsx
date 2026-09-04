import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("../../services/formsService", () => ({
  formsService: { listDocuments: jest.fn(), renameDocument: jest.fn(), deleteDocument: jest.fn() },
}));
jest.mock("../../services/agreementsService", () => ({
  agreementsService: { listAgreements: jest.fn(), downloadAgreementPdf: jest.fn() },
}));

import { formsService } from "../../services/formsService";
import { agreementsService } from "../../services/agreementsService";
import { MatterFormsList } from "./Folders";

const AGREEMENT = {
  kind: "agreement",
  id: 7,
  matter_id: 42,
  folder_id: 3,
  agreement_type: "separation_agreement",
  file_name: "separation_agreement_M-2026-01.pdf",
  status: "draft",
  revision: 2,
  has_pdf: true,
  generated: "2026-09-04T14:30:00.000Z",
  created: "2026-09-01T09:00:00.000Z",
  updated: "2026-09-04T14:31:00.000Z",
};

const FORM = {
  id: 11,
  matter_id: 42,
  folder_id: 3,
  file_name: "Form 13.1.pdf",
  status: "IN_PROGRESS",
  updated: "2026-09-03T10:00:00.000Z",
};

// CRA's jest config resets mock implementations between tests, so the
// defaults are set here rather than once at the top of the file.
beforeEach(() => {
  formsService.listDocuments.mockResolvedValue([]);
  agreementsService.listAgreements.mockResolvedValue([]);
  URL.createObjectURL = jest.fn(() => "blob:agreement");
  URL.revokeObjectURL = jest.fn();
});

const renderList = (props = {}) =>
  render(
    <MemoryRouter>
      <MatterFormsList matterNumber="M-2026-01" folderId={3} {...props} />
    </MemoryRouter>
  );

test("shows a generated agreement filed into this folder", async () => {
  agreementsService.listAgreements.mockResolvedValue([AGREEMENT]);

  renderList();

  expect(await screen.findByText("separation_agreement_M-2026-01.pdf")).toBeInTheDocument();
  expect(screen.queryByText(/Nothing has been created in this folder yet/)).not.toBeInTheDocument();
});

test("asks for the agreements filed in this folder only", async () => {
  renderList();

  await waitFor(() => expect(agreementsService.listAgreements).toHaveBeenCalledWith("M-2026-01", 3));
});

test("lists form documents and generated agreements together", async () => {
  formsService.listDocuments.mockResolvedValue([FORM]);
  agreementsService.listAgreements.mockResolvedValue([AGREEMENT]);

  renderList();

  expect(await screen.findByText("Form 13.1.pdf")).toBeInTheDocument();
  expect(screen.getByText("separation_agreement_M-2026-01.pdf")).toBeInTheDocument();
});

test("an agreement row offers Download, not the form's Open/Rename/Delete", async () => {
  agreementsService.listAgreements.mockResolvedValue([AGREEMENT]);

  renderList();

  expect(await screen.findByRole("button", { name: "Download" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Rename" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
});

test("downloading an agreement saves it under its stored filename", async () => {
  agreementsService.listAgreements.mockResolvedValue([AGREEMENT]);
  agreementsService.downloadAgreementPdf.mockResolvedValue({ data: new Blob(["%PDF-1.4"]) });
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  renderList();
  fireEvent.click(await screen.findByRole("button", { name: "Download" }));

  await waitFor(() =>
    expect(agreementsService.downloadAgreementPdf).toHaveBeenCalledWith("M-2026-01", "separation_agreement")
  );
  await waitFor(() => expect(click).toHaveBeenCalled());
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:agreement");
  click.mockRestore();
});

test("a draft with no generated PDF is not listed as a document", async () => {
  agreementsService.listAgreements.mockResolvedValue([{ ...AGREEMENT, has_pdf: false }]);

  renderList();

  expect(await screen.findByText(/Nothing has been created in this folder yet/)).toBeInTheDocument();
});

test("a listing that is not an array empties the folder instead of breaking it", async () => {
  // What a service returning an unwrapped response envelope looks like here.
  formsService.listDocuments.mockResolvedValue([FORM]);
  agreementsService.listAgreements.mockResolvedValue({ code: 200, status: "success", body: [AGREEMENT] });

  renderList();

  expect(await screen.findByText("Form 13.1.pdf")).toBeInTheDocument();
  expect(screen.queryByText("separation_agreement_M-2026-01.pdf")).not.toBeInTheDocument();
});

test("says so when the agreements could not be loaded, rather than looking empty", async () => {
  formsService.listDocuments.mockResolvedValue([FORM]);
  agreementsService.listAgreements.mockRejectedValue(new Error("boom"));

  renderList();

  expect(await screen.findByRole("alert")).toHaveTextContent("Generated agreements could not be loaded.");
});

test("forms still list when the agreements request fails", async () => {
  formsService.listDocuments.mockResolvedValue([FORM]);
  agreementsService.listAgreements.mockRejectedValue(new Error("boom"));

  renderList();

  expect(await screen.findByText("Form 13.1.pdf")).toBeInTheDocument();
});

test("agreements still list when the forms request fails", async () => {
  formsService.listDocuments.mockRejectedValue(new Error("boom"));
  agreementsService.listAgreements.mockResolvedValue([AGREEMENT]);

  renderList();

  expect(await screen.findByText("separation_agreement_M-2026-01.pdf")).toBeInTheDocument();
});

test("only an error when neither kind of document could be loaded", async () => {
  formsService.listDocuments.mockRejectedValue(new Error("boom"));
  agreementsService.listAgreements.mockRejectedValue(new Error("boom"));

  renderList();

  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load this folder.");
});

test("an empty folder says so instead of showing an error", async () => {
  renderList();

  expect(await screen.findByText(/Nothing has been created in this folder yet/)).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
