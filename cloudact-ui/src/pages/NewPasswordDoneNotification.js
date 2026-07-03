import React from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { Image } from "react-bootstrap";
import Email from "../assets/images/email.png";
import { Link, useLocation, useHistory } from "react-router-dom";
// import Logo from "../assets/images/CloudAct-Accounting-Taxation-logo-1 3.png";
import ResetPasswordImage from "../assets/images/Reset password.svg"

const NewPasswordDoneNotification = () => {
  return (
    <div className="loginSection">
      <div className="login">
        {/* <Link className="brand" to="/"><Image src={Logo} /></Link> */}
        <div className="loginFields">
          <span className="h3 justify-content-center">Please sign in</span>
          <span className="h5 justify-content-center text-center email">Password for your account has been reset. <br></br> Sign in to continue</span>
          <Link to="/signin" className="btn btnPrimary">Sign in</Link>
          <span className="text justify-content-center text-center mt-4"><Link to="/signin" className="text-primary-color heading-6 fw-bold"><i className="fas fa-angle-left"></i> Back to log in</Link></span>
        </div>
      </div>
      <div className="loginGraphic"><img src={ResetPasswordImage} alt="email notification"></img></div>
      <Footer />
    </div>
  );
};

export default NewPasswordDoneNotification;
