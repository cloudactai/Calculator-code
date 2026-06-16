import React from "react";
import { Image } from "react-bootstrap";
import { Link } from "react-router-dom";

const CheckoutSteps = ({
  activeFormNumber,
  isClioConnected,
  isQBOConnected,
}) => {
  return (
    <div className="statusSteps rowView">
      <div
        className={`${activeFormNumber === 1 ? "active" : ""} ${
          activeFormNumber > 1 ? "done" : ""
        }`}
      >
        {activeFormNumber === 2 ||
        activeFormNumber === 3 ||
        activeFormNumber === 4 ? (
          <Link to="/setupwizard?step=1">Add a Law firm</Link>
        ) : (
          <>Add a Law firm</>
        )}
      </div>
      <div
        className={`${activeFormNumber === 2 ? "active" : ""} ${
          activeFormNumber > 2 ? "done" : ""
        }`}
      >
        {activeFormNumber === 1 ||
        activeFormNumber === 3 ||
        activeFormNumber === 4 ? (
          <Link to="/setupwizard?step=2">Select Products</Link>
        ) : (
          <>Select Products</>
        )}
      </div>
      <div
        className={`${activeFormNumber === 3 ? "active" : ""} ${
          activeFormNumber > 3 ? "done" : ""
        }`}
      >
        {activeFormNumber === 4 ? (
          <Link to="/setupwizard?step=3">Connect To Clio</Link>
        ) : (
          <>Connections</>
        )}
      </div>
      {/* <div className={`${activeFormNumber === 3 ? "active" : ""} ${activeFormNumber === 4 ? "done" : ''}`}>{activeFormNumber === 4 ? (
          <Link to="/setupwizard?step=3">Connect To QBO</Link>
        ) : (<>Connect to QBO</>)}
      </div> */}
      <div className={`${activeFormNumber === 4 ? "active" : ""}`}>
        Account details
      </div>
    </div>
  );
};

export default CheckoutSteps;
