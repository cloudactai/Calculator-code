import React, { useState } from "react";
const Dropdown = ({
  list,
  isDisabled = false,
  handleChange,
  curListItem,
  addClassName,
  placeholder,
}) => {

  const [open, setopen] = useState(false);
  const onClick = () => setopen(!open);

  if (open) {
    document.addEventListener("click", function closeDropdown(e) {
      if (!e.target.matches(".dropdownBtn")) {
        setopen(false);
        document.removeEventListener("click", closeDropdown);
      }
    });
  }

  placeholder = placeholder ? placeholder : "Choose Option";

  return (
    <div className={`dropdown ${addClassName ? addClassName : ""}`}>
      <button
        onClick={isDisabled ? null : onClick}
        className={`dropdownBtn ${isDisabled ? "disabled" : ""}`}
      >
        {curListItem ? curListItem : placeholder}
        {open ? (
        <i class='fas fa-angle-up'></i>
      ) : (
        <i class='fas fa-angle-down'></i>
      )}
      </button>
      <div className={`dropdownList ${open ? "show" : "hide"}`}>
        {list && list.map((li, key) => (
          // eslint-disable-next-line jsx-a11y/anchor-is-valid
          <a
            // eslint-disable-next-line no-script-url
            href="javascript:void(0)"
            key={key}
            disabled={isDisabled}
            onClick={(e) => {
              setopen(!open);
              handleChange(e, li);
            }}
          >
            {li.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default Dropdown;
