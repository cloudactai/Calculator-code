import React, { useState } from "react";
import InfoContent from "../assets/images/InfoContent.png";

const InfoButton = ({ children }) => {
  const [infoState, setInfoState] = useState({
    showMessage: false,
  });

  const showInfo = (e) => {
    e.preventDefault();
    setInfoState({ showMessage: true });

    setTimeout(() => {
      setInfoState({ showMessage: false });
    }, 4000);
  };

  return (
    <span className="infoBtn" onClick={showInfo}><i className="fa-solid fa-circle-info"></i><div className={`${infoState.showMessage ? "show" : "hide"}`}>{children}</div></span>
  );
};

export default InfoButton;
