// The lawyer "Full Name" field on the background form: a normal text input
// (opposing counsel is often not in the address book, so free text has to keep
// working) with a dropdown of the saved lawyers hanging off it. Picking one
// auto-fills the rest of the lawyer block.
import { useEffect, useRef, useState } from "react";

import "./lawyerAddressBook.css";

const LawyerNamePicker = ({
  value,
  name = "lawyerName",
  placeholder = "Enter Name",
  onChange,
  onSelectLawyer,
  lawyers = [],
  id,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocumentMouseDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, [open]);

  // Typing narrows the list. Two cases deliberately show everything instead:
  // the field already holds a saved lawyer's exact name (the user picked one
  // and is now looking to switch), and a filter that matches nothing (this is
  // a picker, so an empty popup would just look broken).
  const normalize = (text) => String(text || "").trim().toLowerCase();
  const typed = normalize(value);
  const isSavedLawyer = lawyers.some((l) => normalize(l.name) === typed);
  const matches =
    typed && !isSavedLawyer
      ? lawyers.filter((l) => normalize(l.name).includes(typed))
      : lawyers;
  const visible = matches.length ? matches : lawyers;

  return (
    <div className="lawyer-name-picker" ref={containerRef}>
      <input
        id={id}
        type="text"
        className="form-control"
        placeholder={placeholder}
        name={name}
        value={value || ""}
        autoComplete="off"
        onChange={onChange}
      />
      <button
        type="button"
        className="lawyer-name-picker-toggle"
        aria-label="Show lawyers from the address book"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <i className={`fas fa-angle-${open ? "up" : "down"}`} />
      </button>

      {open && (
        <div className="lawyer-name-picker-list" role="listbox">
          {visible.length === 0 ? (
            <div className="lawyer-name-picker-empty">
              No lawyers in the address book yet.
            </div>
          ) : (
            visible.map((lawyer) => (
              <button
                type="button"
                key={lawyer.id}
                role="option"
                aria-selected={lawyer.name === value}
                onClick={() => {
                  setOpen(false);
                  onSelectLawyer(lawyer);
                }}
              >
                {lawyer.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LawyerNamePicker;
