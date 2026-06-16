import React from "react";
import PropTypes from "prop-types";

const RadioInput = ({
  name,
  checked,
  label,
  size,
  isDisabled,
  styles,
  onChangeFunc,
}) => {
  return (
    <label className={`customCheck`}><input required type="radio" checked={checked} onChange={(e) => {onChangeFunc()}} name={name} disabled={isDisabled}></input>{label}</label>
  );
};

RadioInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  size: PropTypes.string,
  isDisabled: PropTypes.bool,
};

export default RadioInput;
