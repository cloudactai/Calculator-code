import React, { forwardRef, useState } from "react";

const ProfileNumberInput = forwardRef((props, ref) => {
  const [value, setValue] = useState("");

  return (
    <input
      type="number"
      min="0"
      max="9"
      value={value}
      ref={ref}
      onChange={(e) => {
        console.log("e", e.target.value);

        const text = e.target.value;
        if (text >= 0 && text <= 9) {
          setValue(text);
        }
      }}
      className=" text-center profile_input_number mr-1"
    ></input>
  );
});

export default ProfileNumberInput;
