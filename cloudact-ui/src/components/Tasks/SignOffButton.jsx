import React from "react";

const SignOffButton = ({ disabledVal, children, onClickFunc, styles }) => {
  return (
    <button onClick={onClickFunc} className={styles} disabled={disabledVal}>
      {children}
    </button>
  );
};

export default SignOffButton;
