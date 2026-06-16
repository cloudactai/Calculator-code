import React from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ResetPassword from "../components/SignUser/ResetPassword";

const ForgetPassword = () => {
  return (
    <div className="loginSection">
      <ResetPassword />
      <Footer />
    </div>
  );
};

export default ForgetPassword;
