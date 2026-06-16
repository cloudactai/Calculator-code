import React, { useEffect, useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoMdCheckmark } from 'react-icons/io';
import { RxCross2 } from 'react-icons/rx';
import { CiEdit } from 'react-icons/ci';
import { IoSearchOutline } from "react-icons/io5";

const EntryModal = ({
  isModalOpen,
  currentPage,
  timeEntryData,
  selectedEntries,
  editable,
  handleCheckboxChange,
  handletextChange,
  timeEntryChangeBtnVisible,
  isNewBtnVisible,
  handleCancelClick,
  handleSaveClick,
  handleNewChangeClick,
  setIsModalOpen,
  setCurrentPage
}) => {
  const [searchEntryText, setSearchEntryText] = useState("");
  const [filteredEntries, setFilteredEntries] = useState(timeEntryData);

  useEffect(() => {
    // Filter entries based on the search text
    if (searchEntryText === "") {
      setFilteredEntries(timeEntryData);
    } else {
      const filtered = timeEntryData.filter(entry => {
        return (
          entry.date.toLowerCase().includes(searchEntryText.toLowerCase()) ||
          entry.qty.toString().includes(searchEntryText) ||
          entry.description.toLowerCase().includes(searchEntryText.toLowerCase()) ||
          entry.amount.toString().includes(searchEntryText)
        );
      });
      setFilteredEntries(filtered);
    }
  }, [searchEntryText, timeEntryData]);

  // Check if there are any required entries
  const hasRequiredEntries = filteredEntries.some(entry => entry.required);

  if (!isModalOpen.show || currentPage !== 4) {
    return null;
  }

  return (
    <div className="container">
      <div className="time-entry-header d-flex justify-content-between align-items-center mb-2">
        {/* Header */}
        <h5 style={{ fontWeight: "bold" }}>
          {isModalOpen.type === "expenseEntry" ? "Expense Entry" : "Time Entry"}
        </h5>

        {/* Buttons */}
        <div className="d-flex">
          {timeEntryChangeBtnVisible && hasRequiredEntries && (
            <div className="d-flex justify-content-between align-items-center gap-2 mx-3">
              {isNewBtnVisible ? (
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="cancelRedBtn"
                    onClick={handleCancelClick}
                  >
                    <RxCross2 /> Cancel
                  </button>
                  <button
                    type="button"
                    className="saveGreenBtn"
                    onClick={handleSaveClick}
                  >
                    <IoMdCheckmark /> Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="editBtn btn btnPrimary m-0"
                  onClick={handleNewChangeClick}
                >
                  <CiEdit size={18} /> Change
                </button>
              )}
            </div>
          )}

          {/* Search Bar */}
          <div className="d-flex gap-2 align-items-center">
            <div
              className="border-0 p-2 d-flex align-items-center justify-content-center"
              style={{
                background: "#E3F3FF",
                borderRadius: "25px",
                padding: "4px",
              }}
            >
              <input
                type="search"
                placeholder="Search"
                value={searchEntryText}
                onChange={(e) => setSearchEntryText(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
              {/* Clear Button */}
              <RxCross2
                fontSize={16}
                style={{ cursor: "pointer" }}
                onClick={() => setSearchEntryText("")}
              />
              {/* Search Button */}
              <IoSearchOutline
                fontSize={16}
                style={{ marginLeft: "8px", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="table-outer-border">
        <table className="table table-bordered">
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "white",
              zIndex: 1,
            }}
          >
            <tr>
              <th>Date</th>
              <th style={{ textAlign: "center" }}>Qty</th>
              <th style={{ textAlign: "center" }}>Description</th>
              <th style={{ textAlign: "center" }}>Amount ($)</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, index) => (
              <tr key={entry.id}>
                <td>
                  <input
                    type="checkbox"
                    className="mr-2 timeEntryCheckbox"
                    checked={selectedEntries.includes(entry.id)}
                    onChange={(e) =>
                      handleCheckboxChange(entry.id, index, e, isModalOpen.type, isModalOpen.id)
                    }
                  />
                  {entry.date}
                </td>
                <td style={{ textAlign: "center" }}>
                  {editable && selectedEntries.includes(entry.id) ? (
                    <span
                      onInput={(e) =>
                        handletextChange(entry.id, index, e, isModalOpen.type, isModalOpen.id, "qty")
                      }
                      className="editableContent"
                      contentEditable="true"
                      suppressContentEditableWarning={true}
                    >
                      {entry.qty}
                    </span>
                  ) : (
                    <span>{entry.qty}</span>
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  {editable && selectedEntries.includes(entry.id) ? (
                    <span
                      onInput={(e) =>
                        handletextChange(entry.id, index, e, isModalOpen.type, isModalOpen.id, "description")
                      }
                      className="editableContent"
                      contentEditable="true"
                      suppressContentEditableWarning={true}
                    >
                      {entry.description}
                    </span>
                  ) : (
                    <span>{entry.description}</span>
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  {editable && selectedEntries.includes(entry.id) ? (
                    <span
                      onInput={(e) => {
                        const value = e.target.textContent;

                        // Allow only integers
                        if (/^\d*$/.test(value.replace(/,/g, ""))) {
                          handletextChange(entry.id, index, e, isModalOpen.type, isModalOpen.id, "amount");
                        } else {
                          // Remove invalid characters
                          e.target.textContent = value.replace(/[^0-9]/g, "");

                          // Move cursor to the end
                          const selection = document.getSelection();
                          const range = document.createRange();
                          range.selectNodeContents(e.target);
                          range.collapse(false);
                          selection.removeAllRanges();
                          selection.addRange(range);
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.textContent;

                        // Format the value on blur
                        e.target.textContent = Number(value.replace(/,/g, "")).toLocaleString("en-IN");

                        handletextChange(entry.id, index, e, isModalOpen.type, isModalOpen.id, "amount");
                      }}
                      className="editableContent"
                      contentEditable="true"
                      suppressContentEditableWarning={true}
                    >
                      {entry.amount.toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span>{entry.amount.toLocaleString("en-IN")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between">
        <div>
          <style>
            {
              `.circleBackButton {
                width: 40px;
                height: 40px;
                background-color: #e6f3ff;
                border: none;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                cursor: pointer;
                transition: background-color 0.3s ease;
              }

              .circleBackButton:hover {
                background-color: #cce7ff;
              }

              .circleBackButton svg {
                font-size: 24px;
                color: #007bff;
              }`
            }
          </style>

          <button
            type="button"
            className="circleBackButton"
            onClick={() => {
              setIsModalOpen({ show: false, type: "", id: "" });
              setCurrentPage(3);
            }}
          >
            <IoIosArrowRoundBack />
          </button>
        </div>
      </div>

    </div>
  );
};

export default EntryModal;
