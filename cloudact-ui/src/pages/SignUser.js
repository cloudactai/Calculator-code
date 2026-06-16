import React from "react";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import SignIn from "../components/SignUser/SignIn";
import { UN_AUTH_ROUTES } from "../routes/Routes.types";

const SignUp = ({
  isLinkConfirmed,
  setUserLogin,
  changeLinkConfirmed,
  changeClioConnected,
  changeQBOConnected,
  isUserLogged,
  updateuserInfo,
}) => {
  return (
    <div className="loginSection">
      <SignIn setUserLogin={setUserLogin} changeLinkConfirmed={changeLinkConfirmed} isUserLogged={isUserLogged} isLinkConfirmed={isLinkConfirmed} changeClioConnected={changeClioConnected} changeQBOConnected={changeQBOConnected} updateuserInfo={updateuserInfo} />
      <Footer />
    </div>
  );
};

export default SignUp;
