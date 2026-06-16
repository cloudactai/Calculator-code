import React from "react";
import Nav from "../components/Nav";
import Login from "../components/Setup/Login";
import FooterDash from "../components/Dashboard/FooterDash/FooterDash";

const Setupwizard = ({
  changeClioConnected,
  changeQBOConnected,
  isClioConnected,
  isQBOConnected,
}) => {
  return (
    <div className="setupWizard">
      <Nav/>
      <Login isClioConnected={isClioConnected} isQBOConnected={isQBOConnected} changeClioConnected={changeClioConnected} changeQBOConnected={changeQBOConnected}></Login>
      <FooterDash/>
    </div>
  );
};

export default Setupwizard;
