import React from "react";

const PasswordStrength = ({ strength }) => {
  return (
    <>
    <div className={`strength ${strength}`}>
      {strength}
    </div>
    </>
  );
};

export default PasswordStrength;
