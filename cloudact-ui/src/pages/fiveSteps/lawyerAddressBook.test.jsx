/**
 * Lawyer address book on the Background information form: the dropdown on the
 * lawyer's Full Name, the "Lawyer Addressbook" modal, adding a lawyer, and the
 * auto-fill of the remaining lawyer fields.
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("../../utils/helpers", () => ({
  ...jest.requireActual("../../utils/helpers"),
  getUserSID: () => "1",
  getCurrentUserFromCookies: () => ({ province: "ON" }),
}));
jest.mock("../../utils/fetchRequest", () => ({ fetchRequest: jest.fn() }));

import { Modal } from "react-bootstrap";

import { fetchRequest } from "../../utils/fetchRequest";
import store from "../../store";
import BackgroundInformationSimple from "./BackgroundInformationSimple";

const SAM = {
  id: 1,
  name: "Sam Smith",
  address: "Barrie Road",
  municipality: "Barrie",
  province: "Ontario",
  postalCode: "L4M 1A1",
  phone: "12135",
  email: "SamSmith@gmail.com",
  memberOfFirm: true,
};

const wrap = (body) => ({ data: { data: { body } } });

// The client's background row already says "represented by Lawyer" so the
// lawyer block (and with it the address book) is on screen.
const savedBackground = [
  { role: "Client", name: "Alex Doe", representedBy: "Lawyer" },
  { role: "Opposing Party", name: "Jane Doe" },
];

let lawyerBook;

beforeEach(() => {
  lawyerBook = [SAM];
  fetchRequest.mockReset();
  fetchRequest.mockImplementation(async (method, endpoint, payload) => {
    if (endpoint === "lawyers" && method === "get") return wrap(lawyerBook);
    if (endpoint === "lawyers" && method === "post") {
      const created = { ...payload, id: lawyerBook.length + 1 };
      lawyerBook = [...lawyerBook, created];
      return wrap(created);
    }
    if (String(endpoint).startsWith("get_single_matter_data/")) {
      return endpoint.endsWith("/background")
        ? wrap(savedBackground)
        : wrap([]);
    }
    return wrap([]);
  });
});

const onUpdateFormData = jest.fn();

function renderForm() {
  onUpdateFormData.mockClear();
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <BackgroundInformationSimple
          matterId="1"
          onUpdateFormData={onUpdateFormData}
          matterData={{}}
          bgInfoActiveTab="Client"
          setBgInfoActiveTab={() => {}}
        />
      </MemoryRouter>
    </Provider>
  );
}

// The section body emitted for the client after the latest change.
const lastClientBody = () =>
  onUpdateFormData.mock.calls[onUpdateFormData.mock.calls.length - 1][0]
    .background.client;

test("the lawyer Full Name dropdown lists the firm's lawyers and auto-fills the rest", async () => {
  renderForm();

  const toggle = await screen.findByRole("button", {
    name: /show lawyers from the address book/i,
  });
  fireEvent.click(toggle);

  fireEvent.click(await screen.findByRole("option", { name: "Sam Smith" }));

  await waitFor(() => {
    expect(lastClientBody()).toMatchObject({
      lawyerName: "Sam Smith",
      lawyerAddress: "Barrie Road",
      lawyerMunicipality: "Barrie",
      lawyerPostalCode: "L4M 1A1",
      lawyerPhone: "12135",
      lawyerEmail: "SamSmith@gmail.com",
      lawyerProvince: "Ontario",
    });
  });
});

test("after picking one lawyer the dropdown still offers the others", async () => {
  lawyerBook = [SAM, { ...SAM, id: 2, name: "Laura Lawyer" }];
  renderForm();

  const toggle = await screen.findByRole("button", {
    name: /show lawyers from the address book/i,
  });

  fireEvent.click(toggle);
  fireEvent.click(await screen.findByRole("option", { name: "Sam Smith" }));

  // The field now reads "Sam Smith" — that must not filter Laura out.
  fireEvent.click(toggle);
  expect(
    await screen.findByRole("option", { name: "Laura Lawyer" })
  ).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Sam Smith" })).toBeInTheDocument();
});

test("a name typed by hand is still accepted (opposing counsel is not in the book)", async () => {
  renderForm();

  const input = await screen.findByLabelText("Full Name*");
  fireEvent.change(input, { target: { value: "Laura Lawyer" } });

  await waitFor(() => {
    expect(lastClientBody().lawyerName).toBe("Laura Lawyer");
  });
});

test("Lawyer Addressbook opens the address book and inserts the selected lawyer", async () => {
  renderForm();

  fireEvent.click(
    await screen.findByRole("button", { name: "Lawyer Addressbook" })
  );

  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Lawyer details")).toBeInTheDocument();
  expect(within(dialog).getByText("Member of our firm")).toBeInTheDocument();

  const insert = within(dialog).getByRole("button", {
    name: "Insert Lawyer details",
  });
  // Nothing is selected yet, so there is nothing to insert.
  expect(insert).toBeDisabled();

  fireEvent.click(await within(dialog).findByText("Sam Smith"));
  expect(insert).toBeEnabled();
  fireEvent.click(insert);

  await waitFor(() => {
    expect(lastClientBody()).toMatchObject({
      lawyerName: "Sam Smith",
      lawyerEmail: "SamSmith@gmail.com",
      lawyerPostalCode: "L4M 1A1",
    });
  });
});

test("+Add saves a new lawyer to the address book and it becomes selectable", async () => {
  renderForm();

  fireEvent.click(
    await screen.findByRole("button", { name: "Lawyer Addressbook" })
  );
  const dialog = await screen.findByRole("dialog");

  fireEvent.click(within(dialog).getByRole("button", { name: "+Add" }));
  fireEvent.change(within(dialog).getByLabelText("Lawyer Name*"), {
    target: { value: "Laura Lawyer" },
  });
  fireEvent.change(within(dialog).getByLabelText("Address"), {
    target: { value: "12 King St" },
  });
  fireEvent.change(within(dialog).getByLabelText("Phone"), {
    target: { value: "6473703476" },
  });
  fireEvent.change(within(dialog).getByLabelText("Email"), {
    target: { value: "laura@firm.com" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save lawyer" }));

  // Persisted through the API...
  await waitFor(() => {
    expect(fetchRequest).toHaveBeenCalledWith(
      "post",
      "lawyers",
      expect.objectContaining({
        name: "Laura Lawyer",
        address: "12 King St",
        phone: "6473703476",
        email: "laura@firm.com",
      })
    );
  });

  // ...and the reloaded list shows it.
  expect(await within(dialog).findByText("Laura Lawyer")).toBeInTheDocument();
});

test("a blank lawyer name is rejected before any request is made", async () => {
  renderForm();

  fireEvent.click(
    await screen.findByRole("button", { name: "Lawyer Addressbook" })
  );
  const dialog = await screen.findByRole("dialog");

  fireEvent.click(within(dialog).getByRole("button", { name: "+Add" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Save lawyer" }));

  expect(
    await within(dialog).findByText("Lawyer name is required.")
  ).toBeInTheDocument();
  expect(fetchRequest).not.toHaveBeenCalledWith(
    "post",
    "lawyers",
    expect.anything()
  );
});

// The other entry point to this form is ProfileSummaryPanel, which renders it
// inside a modal of its own - the address book has to stack on top of that one.
test("the address book still opens when the form itself is inside a modal", async () => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Modal show onHide={() => {}}>
          <Modal.Body>
            <BackgroundInformationSimple
              matterId="1"
              onUpdateFormData={onUpdateFormData}
              matterData={{}}
              bgInfoActiveTab="Client"
              setBgInfoActiveTab={() => {}}
              insideModal
            />
          </Modal.Body>
        </Modal>
      </MemoryRouter>
    </Provider>
  );

  fireEvent.click(
    await screen.findByRole("button", { name: "Lawyer Addressbook" })
  );

  const dialogs = await screen.findAllByRole("dialog");
  expect(dialogs).toHaveLength(2);
  // The address book mounts last, so it is the topmost dialog in the DOM.
  const addressBook = dialogs[dialogs.length - 1];
  expect(within(addressBook).getByText("Lawyer details")).toBeInTheDocument();
  expect(within(addressBook).getByText("Sam Smith")).toBeInTheDocument();

  // Bootstrap gives every backdrop the same z-index, so without the `nested`
  // variant this one renders behind the parent dialog and dims nothing. The
  // CSS keys off these classes — losing them silently breaks the overlay.
  expect(addressBook).toHaveClass("lawyer-addressbook-nested");
  expect(
    document.querySelector(".lawyer-addressbook-backdrop.nested")
  ).toBeInTheDocument();
});
