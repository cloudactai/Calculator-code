import axios from "../axios";
import { FormsArray } from "./MatterFormData";

jest.mock("../axios", () => ({ get: jest.fn() }));

const bcForms = [
  { form_id: 101, doc_id: "BCPC_3", title: "Form 3 - Application about a family law matter", short_title: "BC PC Form 3", category: "Provincial Court – Applications", status: "active", file_name: "BCPC_3.pdf", footer_text: "PFA 712" },
  { form_id: 104, doc_id: "BCPC_4", title: "Form 4 - Financial statement", short_title: "BC PC Form 4", category: "Provincial Court – Financial", status: "active", file_name: "BCPC_4.pdf", footer_text: "PFA 713" },
  { form_id: 106, doc_id: "BCPC_44", title: "Form 44 - Order - general", short_title: "BC PC Form 44", category: "Provincial Court – Orders", status: "active", file_name: "BCPC_44.pdf", footer_text: "PFA 719" },
  { form_id: 130, doc_id: "BCSC_F8", title: "Form F8 - Financial statement", short_title: "BC SC Form F8", category: "Supreme Court – Financial", status: "active", file_name: "BCSC_F8.pdf", footer_text: null },
];

const onForms = [
  { form_id: 1, doc_id: "Form00", title: "Form 00 - Cover - Continuing Record", short_title: "Form 00", category: "Continuing Record", status: "active", file_name: "Form00.pdf", footer_text: null },
];

beforeEach(() => jest.clearAllMocks());

describe("FormsArray province routing", () => {
  it("asks the API for BC and groups the BC categories into their own folders", async () => {
    axios.get.mockResolvedValue({ status: 200, data: { data: bcForms } });

    const folders = await FormsArray("BC", true, true);

    expect(axios.get).toHaveBeenCalledWith("/forms?province=BC&production_ready=true&mapping_ready=true");
    expect(folders.map((folder) => folder.category)).toEqual([
      "Provincial Court – Applications",
      "Provincial Court – Financial",
      "Provincial Court – Orders",
      "Supreme Court – Financial",
    ]);
    // The court stays visible in the folder name so a lawyer cannot file the
    // wrong court's form, and the two courts never share a categoryId.
    expect(folders.map((folder) => folder.categoryId)).toEqual([
      "PROVINCIAL_COURT_APPLICATIONS",
      "PROVINCIAL_COURT_FINANCIAL",
      "PROVINCIAL_COURT_ORDERS",
      "SUPREME_COURT_FINANCIAL",
    ]);
    expect(folders[0].forms).toEqual([
      expect.objectContaining({ id: 101, docId: "BCPC_3", title: "Form 3 - Application about a family law matter", checked: false }),
    ]);
  });

  it("normalizes a spelled-out province name to the BC code", async () => {
    axios.get.mockResolvedValue({ status: 200, data: { data: bcForms } });

    await FormsArray("British Columbia", true, true);

    expect(axios.get).toHaveBeenCalledWith("/forms?province=BC&production_ready=true&mapping_ready=true");
  });

  it("keeps an Ontario matter on the Ontario set", async () => {
    axios.get.mockResolvedValue({ status: 200, data: { data: onForms } });

    const folders = await FormsArray("ON", true, true);

    expect(axios.get).toHaveBeenCalledWith("/forms?province=ON&production_ready=true&mapping_ready=true");
    expect(folders.map((folder) => folder.category)).toEqual(["Continuing Record"]);
    expect(folders.some((folder) => folder.category.includes("Court –"))).toBe(false);
  });
});
