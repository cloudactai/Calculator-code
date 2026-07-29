// "Lawyer details" modal: the user's lawyer address book. Lists the saved
// lawyers, lets the user add/edit/remove entries, and inserts the selected
// entry's details into the party's lawyer block on the background form.
//
// Entries live in the auth-server (/v1/lawyers -> LawyerContact), so they are
// available on every matter, not just the one that created them. The list is
// owned by the caller's useLawyerAddressBook() so the name pickers on the form
// see a newly added lawyer straight away.
import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import toast from "react-hot-toast";

import Dropdown from "../Form/Dropdown";
import { PROVINCE_LIST } from "../../../utils/canadianProvinces";
import { EMPTY_LAWYER } from "../../../utils/Apis/lawyers/lawyerAddressBookApi";
import "./lawyerAddressBook.css";

const MEMBER_OF_FIRM_LIST = [
  { name: "Yes", value: "Yes" },
  { name: "No", value: "No" },
];

const isMemberOfFirm = (value) => value === true || value === "Yes";

// `nested` = opened from a form that is itself inside a modal ("View
// Information and Documents"), where the page is already dimmed. See the
// stacking note in lawyerAddressBook.css.
const LawyerAddressBookModal = ({
  show,
  onHide,
  onInsert,
  addressBook,
  nested = false,
}) => {
  const { lawyers, loading, error: loadError, reload, save, remove } = addressBook;
  const [selectedId, setSelectedId] = useState(null);
  // null when the form is closed; otherwise the entry being added or edited.
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reload every time the modal opens so a lawyer added elsewhere shows up.
  useEffect(() => {
    if (!show) return;
    setSelectedId(null);
    setDraft(null);
    setError("");
    reload();
  }, [show, reload]);

  const selected = lawyers.find((lawyer) => lawyer.id === selectedId) || null;

  // Read the value before the updater runs: React 17 recycles the synthetic
  // event as soon as the handler returns, so `event.target` is gone by then.
  const setDraftField = (field) => (event) => {
    const { value } = event.target;
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    const name = String(draft?.name || "").trim();
    if (!name) {
      setError("Lawyer name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await save({ ...draft, name });
      if (saved?.id) setSelectedId(saved.id);
      setDraft(null);
      toast.success(draft.id ? "Lawyer updated." : "Lawyer added.");
    } catch (err) {
      setError("Could not save the lawyer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await remove(selected.id);
      setSelectedId(null);
      setDraft(null);
      toast.success("Lawyer removed.");
    } catch (err) {
      setError("Could not remove the lawyer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleInsert = () => {
    if (!selected) return;
    onInsert(selected);
    onHide();
  };

  // size="xl", not "lg": at the form's 16px type, six columns plus a real email
  // address overflow an lg dialog and clip the "Member of our firm" header.
  return (
    <Modal
      show={show}
      onHide={onHide}
      keyboard
      centered
      size="xl"
      dialogClassName="customModal lawyer-addressbook-modal"
      backdropClassName={`lawyer-addressbook-backdrop${nested ? " nested" : ""}`}
      className={nested ? "lawyer-addressbook-nested" : undefined}
      aria-labelledby="lawyer-addressbook-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="lawyer-addressbook-title">Lawyer details</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="table-responsive">
          <table className="lawyer-ab-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lawyer Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Member of our firm</th>
              </tr>
            </thead>
            <tbody>
              {lawyers.map((lawyer, index) => (
                <tr
                  key={lawyer.id}
                  className={lawyer.id === selectedId ? "selected" : ""}
                  onClick={() => setSelectedId(lawyer.id)}
                >
                  <td>{index + 1}</td>
                  <td>{lawyer.name}</td>
                  <td>
                    {[lawyer.address, lawyer.municipality, lawyer.province]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                  <td>{lawyer.phone}</td>
                  <td>{lawyer.email}</td>
                  <td>{lawyer.memberOfFirm ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <div className="lawyer-ab-status">Loading lawyers…</div>}
        {!loading && lawyers.length === 0 && (
          <div className="lawyer-ab-empty">
            No lawyers saved yet. Use +Add to create your first entry.
          </div>
        )}

        <div className="lawyer-ab-actions">
          <button
            type="button"
            className="lawyer-ab-link"
            onClick={() => setDraft({ ...EMPTY_LAWYER, memberOfFirm: "Yes" })}
            disabled={saving}
          >
            +Add
          </button>
          {selected && !draft && (
            <>
              <button
                type="button"
                className="lawyer-ab-link"
                onClick={() =>
                  setDraft({
                    ...selected,
                    memberOfFirm: selected.memberOfFirm ? "Yes" : "No",
                  })
                }
                disabled={saving}
              >
                Edit
              </button>
              <button
                type="button"
                className="lawyer-ab-link danger"
                onClick={handleRemove}
                disabled={saving}
              >
                Remove
              </button>
            </>
          )}
        </div>

        {(error || loadError) && (
          <div className="lawyer-ab-error">{error || loadError}</div>
        )}

        {draft && (
          <div className="lawyer-ab-form">
            <div className="lawyer-ab-form-title">
              {draft.id ? "Edit lawyer" : "Add lawyer"}
            </div>
            <div className="lawyer-ab-form-grid">
              <div>
                <label className="form-label" htmlFor="lawyer-ab-name">
                  Lawyer Name*
                </label>
                <input
                  id="lawyer-ab-name"
                  type="text"
                  className="form-control"
                  placeholder="Enter Name"
                  value={draft.name || ""}
                  onChange={setDraftField("name")}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="lawyer-ab-address">
                  Address
                </label>
                <input
                  id="lawyer-ab-address"
                  type="text"
                  className="form-control"
                  placeholder="Write Address"
                  value={draft.address || ""}
                  onChange={setDraftField("address")}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="lawyer-ab-municipality">
                  Municipality
                </label>
                <input
                  id="lawyer-ab-municipality"
                  type="text"
                  className="form-control"
                  placeholder="Enter Municipality"
                  value={draft.municipality || ""}
                  onChange={setDraftField("municipality")}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="lawyer-ab-postal">
                  Postal Code
                </label>
                <input
                  id="lawyer-ab-postal"
                  type="text"
                  className="form-control"
                  placeholder="Write Postal code"
                  value={draft.postalCode || ""}
                  onChange={setDraftField("postalCode")}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="lawyer-ab-phone">
                  Phone
                </label>
                <input
                  id="lawyer-ab-phone"
                  type="text"
                  className="form-control"
                  placeholder="Write Phone"
                  value={draft.phone || ""}
                  onChange={setDraftField("phone")}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="lawyer-ab-email">
                  Email
                </label>
                <input
                  id="lawyer-ab-email"
                  type="email"
                  className="form-control"
                  placeholder="Write Email"
                  value={draft.email || ""}
                  onChange={setDraftField("email")}
                />
              </div>
              <div>
                <label className="form-label">Province</label>
                <Dropdown
                  handleChange={(e, li) =>
                    setDraft((prev) => ({ ...prev, province: li.value }))
                  }
                  list={PROVINCE_LIST}
                  curListItem={draft.province}
                />
              </div>
              <div>
                <label className="form-label">Member of our firm</label>
                <Dropdown
                  handleChange={(e, li) =>
                    setDraft((prev) => ({ ...prev, memberOfFirm: li.value }))
                  }
                  list={MEMBER_OF_FIRM_LIST}
                  curListItem={isMemberOfFirm(draft.memberOfFirm) ? "Yes" : "No"}
                />
              </div>
            </div>
            <div className="lawyer-ab-form-footer">
              <button
                type="button"
                className="btn btnDefault"
                onClick={() => setDraft(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn lawyer-ab-insert"
                onClick={handleSaveDraft}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save lawyer"}
              </button>
            </div>
          </div>
        )}

        {/* In the body rather than a Modal.Footer: the footer's own padding
            left a large gap under +Add. */}
        <div className="lawyer-ab-insert-row">
          <button
            type="button"
            className="btn lawyer-ab-insert"
            onClick={handleInsert}
            disabled={!selected}
          >
            Insert Lawyer details
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default LawyerAddressBookModal;
