import React, { useState } from "react";

const Dropdown = ({
  list = [], // Default to empty array
  isDisabled,
  type,
  handleClientChange,
  curClient,
  addClassName,
  label,
  stateToChange,
}) => {
  const [open, setopen] = useState(false);
  const onClick = () => setopen(!open);

  return (
    <div className={`dropdown ${addClassName ? addClassName : ""}`}>
      <button
        onClick={onClick}
        className={`dropdownBtn ${isDisabled ? "disabled" : ""}`}
      >
        {curClient ? <span>{curClient}</span> : <span>{type}</span>}
        <i className="fas fa-angle-down"></i>
      </button>
      <div className={`dropdownList ${open ? "show" : "hide"}`}>
        {Array.isArray(list) &&
          list.map((e, key) => (
            <a
              href="javascript:void(0)"
              key={key}
              disabled={isDisabled}
              data-role={type === "Firmname" ? e.role : null}
              onClick={(e) => {
                setopen(!open);
                stateToChange(handleClientChange(e, list, type));
              }}
            >
              {type === "Matter Owner"
                ? e.responsible_attorney_name
                : type === "simple"
                ? e
                : type === "Select Client"
                ? e.client_name
                : type === "Status"
                ? e.status
                : type === "Firmname"
                ? e.display_firmname
                : e.name}
            </a>
          ))}
      </div>
    </div>
  );
};
export default Dropdown;