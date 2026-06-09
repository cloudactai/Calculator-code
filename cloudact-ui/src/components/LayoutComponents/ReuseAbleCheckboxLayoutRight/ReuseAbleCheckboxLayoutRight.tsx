import React from "react";

const ReuseAbleCheckboxLayoutRight = ({
  heading,
  options,
  stateOption,
  checked,
  handleOnChangeEvent,
}) => {
  return (
    <div className="form-group">
      <label>{heading}</label>
      <div className="d-flex flex-wrap">
        {options.map((e, key) => (
          <div className="checkboxGroup">
            <label key={key}><input required style={{ marginRight: "0.2rem" }} type="radio" name={stateOption} checked={checked === e} value={e} onChange={(event) => {handleOnChangeEvent(event);}}></input>{e}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReuseAbleCheckboxLayoutRight;
