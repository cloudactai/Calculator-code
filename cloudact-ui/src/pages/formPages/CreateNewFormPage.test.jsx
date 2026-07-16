import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";

jest.mock("../../components/LayoutComponents/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/Loader", () => () => <div>Loading</div>);
jest.mock("../../components/Matters/Form/CustomCheckbox", () => ({ label, checked }) => <label><input type="checkbox" checked={checked} readOnly />{label}</label>);
jest.mock("../../components/Matters/Form/CustomDropdown", () => ({ list = [], curListItem, handleChange }) => (
  <select
    aria-label="Forms selection"
    value={curListItem || ""}
    onChange={(event) => {
      const item = list.find((option) => String(option.value) === event.target.value);
      handleChange(event, item);
    }}
  >
    <option value="">Choose Option</option>
    {list.map((item) => <option key={item.value} value={item.value}>{item.name}</option>)}
  </select>
));
jest.mock("../../components/Matters/Modals/GeneralModal", () => ({ show, children }) => show ? <div>{children}</div> : null);
jest.mock("../../utils/matterData/MatterFormData", () => ({
  FormsArray: jest.fn(() => Promise.resolve({ formsArrayData: [{ category: "Divorce", icon: "", forms: [{ id: 13, title: "Form 13", status: "active", checked: false }] }] })),
}));
jest.mock("../../services/formsService", () => ({
  formsService: {
    listMatters: jest.fn(), getMatterContext: jest.fn(), listFolders: jest.fn(),
    createFolder: jest.fn(), createDocuments: jest.fn(),
  },
}));

import store from "../../store";
import { formsService } from "../../services/formsService";
import { FormsArray } from "../../utils/matterData/MatterFormData";
import CreateNewFormPage from "./CreateNewFormPage";

beforeEach(() => {
  FormsArray.mockResolvedValue([{ category: "Divorce", icon: "", forms: [{ id: 13, title: "Form 13", status: "active", checked: false }] }]);
  formsService.listMatters.mockResolvedValue([{ matterNumber: "CA-1" }]);
  formsService.getMatterContext.mockResolvedValue({ matterNumber: "CA-1", client_id: "Alex", province: "ON" });
  formsService.listFolders.mockResolvedValue([{ id: 4, title: "Forms" }]);
  formsService.createDocuments.mockResolvedValue([{ id: 22 }]);
});

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/forms/create-new"]}>
        <Route path="/forms/create-new" component={CreateNewFormPage} />
        <Route path="/matters/CA-1/forms/22" render={() => <div>FORM EDITOR</div>} />
      </MemoryRouter>
    </Provider>
  );
}

async function selectMatterAndForm() {
  fireEvent.change((await screen.findAllByRole("combobox"))[0], { target: { value: "CA-1" } });
  await screen.findByText("Divorce");
  fireEvent.click(screen.getByText("Divorce"));
  fireEvent.click(await screen.findByText("Form 13"));
}

test("requires a folder before creating selected forms", async () => {
  renderPage();
  await selectMatterAndForm();
  fireEvent.click(screen.getByRole("button", { name: "Create" }));
  expect(await screen.findByText("Create or select a folder before creating forms.")).toBeInTheDocument();
  expect(formsService.createDocuments).not.toHaveBeenCalled();
});

test("creates selected forms through the Forms API and opens the persisted editor", async () => {
  renderPage();
  await selectMatterAndForm();
  fireEvent.change((await screen.findAllByRole("combobox"))[1], { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: "Create" }));
  await waitFor(() => expect(formsService.createDocuments).toHaveBeenCalledWith("CA-1", 4, [13]));
  expect(await screen.findByText("FORM EDITOR")).toBeInTheDocument();
});
