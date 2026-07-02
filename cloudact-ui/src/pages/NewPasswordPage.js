import React, { useState } from "react";
import { Col, Row, Container, Image } from "react-bootstrap";
import { useHistory, useLocation, Link } from "react-router-dom";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import PasswordStrength from "../components/PasswordStrength";
import { resetPassword } from "../utils/Apis/auth/authApi";
import { determineStrengthPassword } from "../utils/helpers";
import ResetPasswordImage from "../assets/images/Reset password.svg"
import Logo from "../assets/images/CloudAct-Accounting-Taxation-logo-1 3.png";


const NewPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [StrengthPass, setStrengthPass] = useState("Weak");

  const history = useHistory();
  const search = useLocation().search;
  // The auth-server emails links as /reset-password?token=…; the legacy email
  // format was ?<rawcode>, so fall back to the raw query string.
  const token = new URLSearchParams(search).get("token") || search.substring(1);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === "" || confirmPassword === "") {
      setPasswordError("Please Enter the new password");
    } else if (password === confirmPassword) {
      resetPassword({ token, password })
        .then(({ ok, data }) => {
          if (ok) {
            history.push("/newPasswordSet");
          } else {
            setPasswordError(
              data?.message || "Reset link is invalid or expired."
            );
          }
        })
        .catch((err) => {
          console.log("err", err);
          setPasswordError("Unable to reach the password service. Try again.");
        });
    } else {
      setConfirmPasswordError("Passwords do not match");
    }
  };

  return (
    <div className="loginSection">
      <div className="login">
        <Link className="brand" to="/"><Image src={Logo} /></Link>
        <div className="loginFields">
          <span className="h3">Reset Password</span>
          <span className="h5">Please enter your new password</span>
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-0">
              <label>New Password</label>
              <input className={`form-control ${passwordError ? "border_red" : "border_blue"}`} placeholder="New Password" value={password} name="email" type="password" onChange={(e) => {setPassword(e.target.value); setPasswordError(""); setStrengthPass(determineStrengthPassword(e.target.value));}}></input>
              {passwordError && (<span className="text-error text">{passwordError}</span>)}
            </div>
            {password && <PasswordStrength strength={StrengthPass} />}
            <div className="form-group">
              <label>Confirm Password</label>
              <input className={`form-control ${confirmPasswordError  ? "border_red" : "border_blue"}`} placeholder="Confirm Password" value={confirmPassword} name="email" type="password" onChange={(e) => {setConfirmPassword(e.target.value);setConfirmPasswordError("");}}></input>
              {confirmPasswordError && (<span className="text-error text">{confirmPasswordError}</span>)}
            </div>
            <button type="submit" className="btn btnPrimary">Continue</button>
          </form>
        </div>
      </div>
      <div className="loginGraphic"><img src={ResetPasswordImage} alt="forgot your password"></img></div>
      <Footer />   
    </div>
  );
};

export default NewPasswordPage;
