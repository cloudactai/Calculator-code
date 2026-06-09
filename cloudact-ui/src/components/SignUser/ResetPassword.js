import axios from "../../utils/axios";
import React, { useState } from "react";
import { Row, Col, Container, Image } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import ForgotYourPasswordImage from "../../assets/images/Forgot_Your_password.svg";
import Logo from "../../assets/images/CloudAct-Accounting-Taxation-logo-1 3.png";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const history = useHistory();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email === "") {
      setEmailError("Enter email address");
    } else {
      axios
        .post("password/recovery", {
          email: email,
        })
        .then((res) => {
          console.log("res", res);

          if (res.data.data.code === 200) {
            history.push(`/resetpassword?email=${email}`);
          } else {
            setEmailError(res.data.data.message);
            // throw res.data.data.message;
          }
        })
        .catch((err) => {
          setEmailError("Please Enter a valid Email");
          console.log("err", err);
        });
    }
  };

  return (
    <>
      <div className="login">
        <Link className="brand" to="/"><Image src={Logo} /></Link>
        <div className="loginFields">
          <span className="h3">Forgot Your password?</span>
          <span className="h5">Enter your email address associated with your CloudAct account</span>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input className={`form-control ${ emailError ? "border_red" : "" }`} value={email} placeholder="Enter your email" name="email" type="email" required onChange={(e) => {setEmail(e.target.value);setEmailError("");}}/>
            </div>
            {emailError && <p className="text-error my-3">{emailError}</p>}
            <button type="submit" className="btn btnPrimary">Continue</button>
          </form>
          <span className="text">Remember your password?{" "}<Link to="/signin">Sign in</Link></span>
        </div>
      </div>
      <div className="loginGraphic"><img src={ForgotYourPasswordImage} alt="forgot your password"></img></div>
    </>
  );
};

export default ResetPassword;
