import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";

jest.mock("../../components/LayoutComponents/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/Loader", () => ({ isLoading }) => isLoading ? <div>Loading</div> : null);
jest.mock("../../components/Matters/Modals/GeneralModal", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/FormPages/forms/newComponents/ModernToolbar", () => () => <div>Toolbar</div>);
jest.mock("../../components/FormPages/forms/newComponents/CalculationManager", () => () => <div />);
jest.mock("./PDFViewer", () => () => <div>PDF VIEWER</div>);
jest.mock("react-hot-toast", () => ({ __esModule: true, default: { error: jest.fn(), success: jest.fn() } }));
jest.mock("react-pdf", () => ({ pdfjs: { GlobalWorkerOptions: {} } }));
jest.mock("pdf-lib", () => ({ PDFDocument: { load: jest.fn() }, PDFName: { of: jest.fn() }, rgb: jest.fn(), StandardFonts: {} }));
jest.mock("../../utils/axios", () => ({ get: jest.fn() }));
jest.mock("../../services/formsService", () => ({
  formsService: { getDocument: jest.fn(), saveDocument: jest.fn(), saveGeneratedPdf: jest.fn() },
}));

import store from "../../store";
import axios from "../../utils/axios";
import { PDFDocument } from "pdf-lib";
import { formsService } from "../../services/formsService";
import FillPdf from "./FillPdf";

beforeEach(() => {
  jest.clearAllMocks();
  URL.createObjectURL = jest.fn(() => "blob:form");
  URL.revokeObjectURL = jest.fn();
  global.fetch = jest.fn(() => Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }));
  formsService.getDocument.mockResolvedValue({
    id: 9,
    docId: "Form14",
    file_name: "Form14.pdf",
    folder_id: 2,
    revision: 1,
    template_version: 1,
    fieldValues: {},
    mapping: { staticFields: [{ id: "name", page: 1, type: "TextField", x: 0, y: 0, width: 20, height: 20, color: [0, 0, 0] }] },
  });
  axios.get.mockResolvedValue({ data: new Blob(["%PDF-test"], { type: "application/pdf" }) });
  PDFDocument.load.mockResolvedValue({ getPageCount: () => 1 });
});

test("clicking the current form in the sidebar leaves the loaded PDF visible", async () => {
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/matters/TEST-FORMS/forms/9"]}>
        <Route path="/matters/:matterNumber/forms/:documentId" component={FillPdf} />
      </MemoryRouter>
    </Provider>
  );

  await screen.findByText("PDF VIEWER");
  fireEvent.click(screen.getByRole("button", { name: "Form14.pdf" }).parentElement);

  await waitFor(() => expect(screen.getByText("PDF VIEWER")).toBeInTheDocument());
  expect(axios.get).toHaveBeenCalledTimes(1);
});
