import React from "react";

const DoubleInput = ({
  val,
  handleChange,
  labelValue,
  name,
  fixedVal,
  showCross,
  deleteElement,
}) => {
  return (
    <div className="form-group mb-0">
      <label>{labelValue}</label>
      <div className="doubleInput">
        <input type="number" value={fixedVal}/>
        <input type="text" required name={name} onChange={(e) => handleChange(e.target.value)}value={val}/>
        {showCross && (
          <button onClick={(e) => {e.preventDefault();deleteElement(val);}}><i className="fa-solid fa-times"></i></button>
        )}
      </div>
    </div>
  );
};

export default DoubleInput;
