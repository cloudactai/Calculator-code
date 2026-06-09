import React from "react";

const CheckboxLayoutRight = ({
  heading,
  options,
  sectionB,
  setSectionB,
  stateOption,
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center">
      <span className="heading-5 mr-1">{heading}</span>
      <div style={{ marginLeft: "auto" }} className="d-flex align-items-start">
        {options.map((e, key) => (
          <div key={key} className="mr-1 my-2 d-flex align-items-center">
            <input
              required
              className="radio_box my-2"
              style={{ marginRight: "0.2rem" }}
              type="radio"
              name={stateOption}
              checked={sectionB[stateOption] === e}
              value={e}
              onChange={(event) => {
                setSectionB({
                  ...sectionB,
                  [stateOption]: event.target.value,
                });
              }}
            ></input>
            <label className="heading-5" htmlFor="YesOrNo">
              {e}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckboxLayoutRight;
