/**
 * UPDATE INFORMATION is an enabled task that opens the update AI chat with a
 * fresh database snapshot, and records its task state like the other tasks.
 */
import React from "react";
import "@testing-library/jest-dom";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";

const mockUpdatePanelProps = jest.fn();

jest.mock("../../components/LayoutComponents/Layout", () => ({ children }) => (
  <div>{children}</div>
));
jest.mock("../../components/MatterWorkflow/MatterIntakeChatPanel", () => () => <div />);
jest.mock("../../components/MatterWorkflow/ChildSupportChatPanel", () => () => <div />);
jest.mock("../../components/MatterWorkflow/SpousalSupportChatPanel", () => () => <div />);
jest.mock("../../components/MatterWorkflow/UpdateInformationChatPanel", () => (props) => {
  mockUpdatePanelProps(props);
  return <div>UPDATE INFORMATION CHAT</div>;
});
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("../../utils/helpers", () => ({
  ...jest.requireActual("../../utils/helpers"),
  getUserSID: () => "1",
}));
jest.mock("../../utils/fetchRequest", () => ({ fetchRequest: jest.fn() }));
jest.mock("../../services/formsService", () => ({
  formsService: {
    listTaskStates: jest.fn(() => Promise.resolve([])),
    setTaskState: jest.fn(() => Promise.resolve({})),
  },
}));

import { fetchRequest } from "../../utils/fetchRequest";
import { formsService } from "../../services/formsService";
import store from "../../store";
import SingleMatter from "./SingleMatter";

const databaseSnapshot = {
  matter_number: "TEST-1",
  client_id: "Lorelai Phinnemore",
  assets: {
    lands: [
      {
        id: 7,
        asset_type: "lands",
        address_of_property: "12 King St",
        market_value: {
          client: { on_date_of_marriage: "", on_valuation_date: "", today: "500000" },
        },
      },
    ],
  },
};

beforeEach(() => {
  localStorage.clear();
  mockUpdatePanelProps.mockClear();
  formsService.listTaskStates.mockResolvedValue([]);
  formsService.setTaskState.mockResolvedValue({});
  fetchRequest.mockImplementation((type, endpoint) => {
    if (endpoint.startsWith("get_single_matter_data_all/")) {
      return Promise.resolve({ data: { data: { body: databaseSnapshot } } });
    }
    if (endpoint.startsWith("get_single_matter/")) {
      return Promise.resolve({
        data: {
          data: { body: [{ client_id: "Lorelai Phinnemore", matterNumber: "TEST-1" }] },
        },
      });
    }
    return Promise.resolve({ data: { data: { body: [] } } });
  });
});

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/single-matter/TEST-1"]}>
        <Route path="/single-matter/:id" component={SingleMatter} />
      </MemoryRouter>
    </Provider>
  );
}

async function startUpdateInformation() {
  renderPage();
  const row = (await screen.findByText("UPDATE INFORMATION")).closest(
    ".mw-task-list__row"
  );
  fireEvent.click(row.querySelector("button"));
  return row;
}

test("UPDATE INFORMATION is enabled and opens the update AI chat", async () => {
  const row = await startUpdateInformation();

  // The task row is a real Start action, not the disabled placeholder.
  expect(row.querySelector("button")).not.toBeDisabled();
  expect(await screen.findByText("UPDATE INFORMATION CHAT")).toBeInTheDocument();
  expect(screen.getByText("Update Information — AI Assistant")).toBeInTheDocument();
});

test("the update chat is given a freshly read database snapshot", async () => {
  await startUpdateInformation();
  await screen.findByText("UPDATE INFORMATION CHAT");

  expect(fetchRequest).toHaveBeenCalledWith(
    "get",
    expect.stringContaining("get_single_matter_data_all/1/TEST-1")
  );
  await waitFor(() =>
    expect(mockUpdatePanelProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ matterId: "TEST-1", matterData: databaseSnapshot })
    )
  );
});

test("starting the task records it as in progress", async () => {
  await startUpdateInformation();

  await waitFor(() =>
    expect(formsService.setTaskState).toHaveBeenCalledWith(
      "TEST-1",
      "update_information",
      "in_progress"
    )
  );
});

test("the task never completes — changing information is recurring work", async () => {
  await startUpdateInformation();
  await screen.findByText("UPDATE INFORMATION CHAT");
  await waitFor(() => expect(mockUpdatePanelProps).toHaveBeenCalled());

  // Saving a change refreshes the snapshot but must not close the task out.
  const { onSaved } = mockUpdatePanelProps.mock.calls.at(-1)[0];
  await act(async () => onSaved(databaseSnapshot));

  expect(formsService.setTaskState).not.toHaveBeenCalledWith(
    "TEST-1",
    "update_information",
    "completed"
  );
});

test("a matter an earlier build marked completed reverts to in progress", async () => {
  formsService.listTaskStates.mockResolvedValue([
    { taskKey: "update_information", status: "completed" },
  ]);
  await startUpdateInformation();

  await waitFor(() =>
    expect(formsService.setTaskState).toHaveBeenCalledWith(
      "TEST-1",
      "update_information",
      "in_progress"
    )
  );
});

test("an already-started task reopens on Resume rather than View", async () => {
  formsService.listTaskStates.mockResolvedValue([
    { taskKey: "update_information", status: "in_progress" },
  ]);
  renderPage();

  const row = (await screen.findByText("UPDATE INFORMATION")).closest(
    ".mw-task-list__row"
  );
  expect(row.querySelector("button")).toHaveTextContent("Resume");
  expect(row).toHaveTextContent("In Progress");
});
