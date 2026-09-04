import "@testing-library/jest-dom";

jest.mock("../utils/axios", () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));

import axios from "../utils/axios";
import { agreementsService } from "./agreementsService";

// agreementRoutes.js replies with the legacy envelope. These fixtures are the
// literal response bodies those routes send, so a change to either side that
// breaks the unwrapping fails here rather than in a lawyer's Documents folder.
const envelope = (payload) => ({ data: { data: { code: 200, status: "success", body: payload } } });

const AGREEMENT_ROW = {
  kind: "agreement",
  id: 7,
  agreement_type: "separation_agreement",
  file_name: "separation_agreement_M-2026-01.pdf",
  status: "draft",
  has_pdf: true,
  updated: "2026-09-04T14:31:00.000Z",
};

beforeEach(() => {
  axios.get.mockResolvedValue(envelope([]));
  axios.put.mockResolvedValue(envelope(null));
  axios.post.mockResolvedValue(envelope(null));
});

test("listAgreements returns the array itself, not the response envelope", async () => {
  axios.get.mockResolvedValue(envelope([AGREEMENT_ROW]));

  const result = await agreementsService.listAgreements("M-2026-01", 3);

  expect(Array.isArray(result)).toBe(true);
  expect(result).toEqual([AGREEMENT_ROW]);
});

test("listAgreements scopes the request to one folder", async () => {
  await agreementsService.listAgreements("CA-2026-00010", 3);

  expect(axios.get).toHaveBeenCalledWith("/matters/CA-2026-00010/agreements", { params: { folderId: 3 } });
});

test("listAgreements without a folder asks for every generated agreement", async () => {
  await agreementsService.listAgreements("CA-2026-00010");

  expect(axios.get).toHaveBeenCalledWith("/matters/CA-2026-00010/agreements", { params: undefined });
});

test("getAgreement unwraps the saved draft so a chat can resume it", async () => {
  const saved = { id: 1, agreementType: "separation_agreement", answers: { a: 1 }, transcript: [{ role: "user" }], hasPdf: true };
  axios.get.mockResolvedValue(envelope(saved));

  const result = await agreementsService.getAgreement("M-2026-01", "separation_agreement");

  expect(result.answers).toEqual({ a: 1 });
  expect(result.transcript).toHaveLength(1);
  expect(result.hasPdf).toBe(true);
});

test("getAgreement passes a matter with no saved draft through as null", async () => {
  axios.get.mockResolvedValue(envelope(null));

  expect(await agreementsService.getAgreement("M-2026-01", "separation_agreement")).toBeNull();
});

test("saveAgreementPdf unwraps the saved row", async () => {
  axios.put.mockResolvedValue(envelope({ id: 7, hasPdf: true, checksum: "abc" }));

  const result = await agreementsService.saveAgreementPdf("M-2026-01", "separation_agreement", new Blob(["%PDF"]), "a.pdf");

  expect(result).toEqual({ id: 7, hasPdf: true, checksum: "abc" });
});

test("saveAgreementPdf sends the bytes as a PDF under the given filename", async () => {
  const blob = new Blob(["%PDF-1.4"]);

  await agreementsService.saveAgreementPdf("M-2026-01", "separation_agreement", blob, "separation_agreement_M-2026-01.pdf");

  expect(axios.put).toHaveBeenCalledWith(
    "/matters/M-2026-01/agreements/separation_agreement/pdf",
    blob,
    { params: { filename: "separation_agreement_M-2026-01.pdf" }, headers: { "Content-Type": "application/pdf" } }
  );
});

test("a plain { data } reply is still unwrapped, envelope or not", async () => {
  axios.get.mockResolvedValue({ data: { data: [AGREEMENT_ROW] } });

  expect(await agreementsService.listAgreements("M-2026-01")).toEqual([AGREEMENT_ROW]);
});

test("a payload that merely has a body field is not mistaken for an envelope", async () => {
  const answers = { body: "the client's own words", code: "X" };
  axios.get.mockResolvedValue({ data: { data: answers } });

  expect(await agreementsService.getAgreement("M-2026-01", "separation_agreement")).toEqual(answers);
});

test("downloadAgreementPdf returns the raw response so the blob survives", async () => {
  const response = { data: new Blob(["%PDF"]) };
  axios.get.mockResolvedValue(response);

  expect(await agreementsService.downloadAgreementPdf("M-2026-01", "separation_agreement")).toBe(response);
  expect(axios.get).toHaveBeenCalledWith(
    "/matters/M-2026-01/agreements/separation_agreement/pdf",
    { responseType: "blob" }
  );
});
